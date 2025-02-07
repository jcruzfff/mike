import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  experimental_generateImage,
  streamObject,
  streamText,
} from 'ai';
import { z } from 'zod';
import { DynamicContextProvider, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { getJwks, verifyJwt } from '@/lib/auth/privy';

import { customModel, imageGenerationModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import {
  codePrompt,
  updateDocumentPrompt,
  getSystemPrompt,
  soltar,
} from '@/lib/ai/prompts';
import {
  deleteChat,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
  getMessagesByChatId,
  getUser,
  createUser,
} from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
  sanitizeUIMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '@/app/(chat)/actions';
import fs from 'fs/promises';
import path from 'path';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { messages, modelId, id } = json;
    console.log('📨 Chat API: Received request:', {
      id,
      modelId,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]
    });

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Chat API: No authorization header or invalid format:', { authHeader });
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract and verify the JWT token
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('❌ Chat API: No token found in header');
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify the JWT token
    try {
      const jwks = await getJwks();
      const verified = await verifyJwt(token, jwks);
      if (!verified) {
        console.log('❌ Chat API: Invalid token');
        return new Response('Unauthorized', { status: 401 });
      }
      
      // Extract user info from verified token
      const { sub: userId, wallet_address: walletAddress } = verified;
      if (!userId || !walletAddress) {
        console.log('❌ Chat API: Missing user info in token');
        return new Response('Unauthorized', { status: 401 });
      }

      // Get or create user
      let [user] = await getUser(walletAddress);
      if (!user) {
        console.log('📝 Chat API: Creating new user for wallet:', walletAddress);
        await createUser(walletAddress);
        [user] = await getUser(walletAddress);
        
        if (!user) {
          console.error('❌ Chat API: Failed to create user');
          return new Response('Failed to create user', { status: 500 });
        }
      }

      const model = models.find((model) => model.id === modelId);
      if (!model) {
        console.log('❌ Chat API: Model not found:', modelId);
        return new Response('Model not found', { status: 404 });
      }

      const coreMessages = convertToCoreMessages(messages);
      const lastUserMessage = getMostRecentUserMessage(coreMessages);

      if (!lastUserMessage) {
        console.log('❌ Chat API: No user message found in:', coreMessages);
        return new Response('No user message found', { status: 400 });
      }

      const chat = await getChatById({ id });
      console.log('💬 Chat API: Found chat:', chat);
      
      const userMessageId = generateUUID();

      if (!chat) {
        console.log('�� Chat API: Creating new chat for user:', user.id);
        const title = await generateTitleFromUserMessage({ message: lastUserMessage });
        await saveChat({ id, userId: user.id, title });
        console.log('✅ Chat API: New chat created:', { id, title });
      } else if (chat.userId !== user.id) {
        console.log('❌ Chat API: Unauthorized - chat belongs to different user', {
          chatUserId: chat.userId,
          requestUserId: user.id
        });
        return new Response('Unauthorized', { status: 401 });
      }

      console.log('💾 Chat API: Saving message:', {
        id: userMessageId,
        role: lastUserMessage.role,
        chatId: id
      });
      
      await saveMessages({
        messages: [
          {
            id: userMessageId,
            role: lastUserMessage.role,
            content: lastUserMessage.content,
            createdAt: new Date(),
            chatId: id,
          },
        ],
      });
      console.log('✅ Chat API: Message saved successfully');

      return createDataStreamResponse({
        execute: (dataStream) => {
          dataStream.writeData({
            type: 'user-message-id',
            content: userMessageId,
          });

          const result = streamText({
            model: customModel(model.apiIdentifier),
            system: getSystemPrompt(soltar),
            messages: coreMessages,
            maxSteps: 5,
            experimental_activeTools: allTools,
            tools: {
              getWeather: {
                description: 'Get the current weather at a location',
                parameters: z.object({
                  latitude: z.number(),
                  longitude: z.number(),
                }),
                execute: async ({ latitude, longitude }) => {
                  const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
                  );

                  const weatherData = await response.json();
                  return weatherData;
                },
              },
              createDocument: {
                description:
                  'Create a document for a writing or content creation activities like image generation. This tool will call other functions that will generate the contents of the document based on the title and kind.',
                parameters: z.object({
                  title: z.string(),
                  kind: z.enum(['text', 'code', 'image']),
                }),
                execute: async ({ title, kind }) => {
                  const id = generateUUID();
                  let draftText = '';

                  dataStream.writeData({
                    type: 'id',
                    content: id,
                  });

                  dataStream.writeData({
                    type: 'title',
                    content: title,
                  });

                  dataStream.writeData({
                    type: 'kind',
                    content: kind,
                  });

                  dataStream.writeData({
                    type: 'clear',
                    content: '',
                  });

                  if (kind === 'text') {
                    const { fullStream } = streamText({
                      model: customModel(model.apiIdentifier),
                      system:
                        'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
                      prompt: title,
                    });

                    for await (const delta of fullStream) {
                      const { type } = delta;

                      if (type === 'text-delta') {
                        const { textDelta } = delta;

                        draftText += textDelta;
                        dataStream.writeData({
                          type: 'text-delta',
                          content: textDelta,
                        });
                      }
                    }

                    dataStream.writeData({ type: 'finish', content: '' });
                  } else if (kind === 'code') {
                    const { fullStream } = streamObject({
                      model: customModel(model.apiIdentifier),
                      system: codePrompt,
                      prompt: title,
                      schema: z.object({
                        code: z.string(),
                      }),
                    });

                    for await (const delta of fullStream) {
                      const { type } = delta;

                      if (type === 'object') {
                        const { object } = delta;
                        const { code } = object;

                        if (code) {
                          dataStream.writeData({
                            type: 'code-delta',
                            content: code ?? '',
                          });

                          draftText = code;
                        }
                      }
                    }

                    dataStream.writeData({ type: 'finish', content: '' });
                  } else if (kind === 'image') {
                    const { image } = await experimental_generateImage({
                      model: imageGenerationModel,
                      prompt: title,
                      n: 1,
                    });

                    draftText = image.base64;

                    dataStream.writeData({
                      type: 'image-delta',
                      content: image.base64,
                    });

                    dataStream.writeData({ type: 'finish', content: '' });
                  }

                  // Save the document
                  await saveDocument({
                    id,
                    title,
                    kind,
                    content: draftText,
                    userId: user.id,
                  });

                  return {
                    id,
                    title,
                    kind,
                    content: draftText,
                  };
                },
              },
              updateDocument: {
                description:
                  'Update an existing document with new content. This tool will call other functions that will generate the contents of the document based on the title and kind.',
                parameters: z.object({
                  id: z.string(),
                  title: z.string(),
                  kind: z.enum(['text', 'code', 'image']),
                }),
                execute: async ({ id, title, kind }) => {
                  const document = await getDocumentById({ id });

                  if (!document) {
                    throw new Error('Document not found');
                  }

                  // Check if user owns the document
                  if (document.userId !== user.id) {
                    throw new Error('Unauthorized');
                  }

                  let draftText = '';

                  dataStream.writeData({
                    type: 'id',
                    content: id,
                  });

                  dataStream.writeData({
                    type: 'title',
                    content: title,
                  });

                  dataStream.writeData({
                    type: 'kind',
                    content: kind,
                  });

                  dataStream.writeData({
                    type: 'clear',
                    content: '',
                  });

                  const { fullStream } = streamText({
                    model: customModel(model.apiIdentifier),
                    system: updateDocumentPrompt(document.content, kind),
                    prompt: JSON.stringify({
                      title,
                      content: document.content,
                    }),
                  });

                  for await (const delta of fullStream) {
                    const { type } = delta;

                    if (type === 'text-delta') {
                      const { textDelta } = delta;

                      draftText += textDelta;
                      dataStream.writeData({
                        type: 'text-delta',
                        content: textDelta,
                      });
                    }
                  }

                  dataStream.writeData({ type: 'finish', content: '' });

                  // Save the document
                  await saveDocument({
                    id,
                    title,
                    kind,
                    content: draftText,
                    userId: user.id,
                  });

                  return {
                    id,
                    title,
                    kind,
                    content: draftText,
                  };
                },
              },
              requestSuggestions: {
                description:
                  'Request suggestions for a document. This tool will call other functions that will generate suggestions based on the document content.',
                parameters: z.object({
                  documentId: z.string(),
                }),
                execute: async ({ documentId }) => {
                  const document = await getDocumentById({ id: documentId });

                  if (!document) {
                    throw new Error('Document not found');
                  }

                  // Check if user owns the document
                  if (document.userId !== user.id) {
                    throw new Error('Unauthorized');
                  }

                  const suggestions: Array<Suggestion> = [];

                  const { fullStream } = streamObject({
                    model: customModel(model.apiIdentifier),
                    system: codePrompt,
                    prompt: JSON.stringify({
                      title: document.title,
                      content: document.content,
                    }),
                    schema: z.object({
                      suggestions: z.array(
                        z.object({
                          originalText: z.string(),
                          suggestedText: z.string(),
                          description: z.string().nullable(),
                        }),
                      ),
                    }),
                  });

                  for await (const delta of fullStream) {
                    const { type } = delta;

                    if (type === 'object') {
                      const { object } = delta;
                      const { suggestions: newSuggestions } = object;

                      if (newSuggestions) {
                      if (code) {
                        dataStream.writeData({
                          type: 'code-delta',
                          content: code ?? '',
                        });

                        draftText = code;
                      }
                    }
                  }

                  dataStream.writeData({ type: 'finish', content: '' });
                } else if (kind === 'image') {
                  const { image } = await experimental_generateImage({
                    model: imageGenerationModel,
                    prompt: title,
                    n: 1,
                  });

                  draftText = image.base64;

                  dataStream.writeData({
                    type: 'image-delta',
                    content: image.base64,
                  });

                  dataStream.writeData({ type: 'finish', content: '' });
                }

                // Save the document
                await saveDocument({
                  id,
                  title,
                  kind,
                  content: draftText,
                  userId: user.id,
                });

                return {
                  id,
                  title,
                  kind,
                  content: draftText,
                };
              },
            },
            updateDocument: {
              description:
                'Update an existing document with new content. This tool will call other functions that will generate the contents of the document based on the title and kind.',
              parameters: z.object({
                id: z.string(),
                title: z.string(),
                kind: z.enum(['text', 'code', 'image']),
              }),
              execute: async ({ id, title, kind }) => {
                const document = await getDocumentById({ id });

                if (!document) {
                  throw new Error('Document not found');
                }

                // Check if user owns the document
                if (document.userId !== user.id) {
                  throw new Error('Unauthorized');
                }

                let draftText = '';

                dataStream.writeData({
                  type: 'id',
                  content: id,
                });

                dataStream.writeData({
                  type: 'title',
                  content: title,
                });

                dataStream.writeData({
                  type: 'kind',
                  content: kind,
                });

                dataStream.writeData({
                  type: 'clear',
                  content: '',
                });

                const { fullStream } = streamText({
                  model: customModel(model.apiIdentifier),
                  system: updateDocumentPrompt(document.content, kind),
                  prompt: JSON.stringify({
                    title,
                    content: document.content,
                  }),
                });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'text-delta') {
                    const { textDelta } = delta;

                    draftText += textDelta;
                    dataStream.writeData({
                      type: 'text-delta',
                      content: textDelta,
                    });
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });

                // Save the document
                await saveDocument({
                  id,
                  title,
                  kind,
                  content: draftText,
                  userId: user.id,
                });

                return {
                  id,
                  title,
                  kind,
                  content: draftText,
                };
              },
            },
            requestSuggestions: {
              description:
                'Request suggestions for a document. This tool will call other functions that will generate suggestions based on the document content.',
              parameters: z.object({
                documentId: z.string(),
              }),
              execute: async ({ documentId }) => {
                const document = await getDocumentById({ id: documentId });

                if (!document) {
                  throw new Error('Document not found');
                }

                // Check if user owns the document
                if (document.userId !== user.id) {
                  throw new Error('Unauthorized');
                }

                const suggestions: Array<Suggestion> = [];

                const { fullStream } = streamObject({
                  model: customModel(model.apiIdentifier),
                  system: codePrompt,
                  prompt: JSON.stringify({
                    title: document.title,
                    content: document.content,
                  }),
                  schema: z.object({
                    suggestions: z.array(
                      z.object({
                        originalText: z.string(),
                        suggestedText: z.string(),
                        description: z.string().nullable(),
                      }),
                    ),
                  }),
                });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'object') {
                    const { object } = delta;
                    const { suggestions: newSuggestions } = object;

                    if (newSuggestions) {
                      for (const suggestion of newSuggestions) {
                        if (suggestion && suggestion.originalText && suggestion.suggestedText) {
                          const id = generateUUID();
                          suggestions.push({
                            id,
                            originalText: suggestion.originalText,
                            suggestedText: suggestion.suggestedText,
                            description: suggestion.description || null,
                            documentId,
                            documentCreatedAt: document.createdAt,
                            userId: user.id,
                            createdAt: new Date(),
                            isResolved: false
                          });
                        }
                      }
                    }
                  }
                }

                await saveSuggestions({ suggestions });

                return suggestions;
              },
            },
          },
          onFinish: async ({ response }) => {
            if (user.id) {
              try {
                const responseMessagesWithoutIncompleteToolCalls =
                  sanitizeResponseMessages(response.messages);

                await saveMessages({
                  messages: responseMessagesWithoutIncompleteToolCalls.map(
                    (message) => {
                      const messageId = generateUUID();

                      if (message.role === 'assistant') {
                        dataStream.writeMessageAnnotation({
                          messageIdFromServer: messageId,
                        });
                      }

                      return {
                        id: messageId,
                        chatId: id,
                        role: message.role,
                        content: message.content,
                        createdAt: new Date(),
                      };
                    },
                  ),
                });
              } catch (error) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'stream-text',
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (error) {
    console.error('Chat API Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const walletAddress = authHeader.split(' ')[1];
    if (!walletAddress) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user by wallet address
    const [user] = await getUser(walletAddress);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Get the chat to verify ownership
    const chat = await getChatById({ id });
    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    // Verify chat ownership
    if (chat.userId !== user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChat({ id });

    return new Response('OK');
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Chat API: No authorization header');
      return new Response('Unauthorized', { status: 401 });
    }

    const walletAddress = authHeader.split(' ')[1];
    if (!walletAddress) {
      console.log('❌ Chat API: No wallet address found');
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user by wallet address
    const [user] = await getUser(walletAddress);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    const chat = await getChatById({ id });
    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.visibility === 'private' && chat.userId !== user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const messages = await getMessagesByChatId({ id });
    return Response.json({ chat, messages });
  } catch (error) {
    console.error('Failed to fetch chat:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 
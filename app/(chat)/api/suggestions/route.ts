import { type Message } from 'ai';
import { z } from 'zod';

import { customModel } from '@/lib/ai';
import { codePrompt } from '@/lib/ai/prompts';
import { getDocumentById, saveSuggestions, getSuggestionsByDocumentId } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

export async function GET(request: Request) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Extract the token (wallet address)
  const walletAddress = authHeader.split(' ')[1];
  if (!walletAddress) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new Response('Missing documentId', { status: 400 });
  }

  const document = await getDocumentById({ id: documentId });

  if (!document) {
    return new Response('Document not found', { status: 404 });
  }

  // Check if user owns the document
  if (document.userId !== walletAddress) {
    return new Response('Unauthorized', { status: 401 });
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  return new Response(JSON.stringify(suggestions), {
    headers: {
      'content-type': 'application/json',
    },
  });
}

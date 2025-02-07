import { openai } from '@ai-sdk/openai';

export const customModel = (apiIdentifier: string) => openai(apiIdentifier);

export const imageGenerationModel = openai.image('dall-e-3');

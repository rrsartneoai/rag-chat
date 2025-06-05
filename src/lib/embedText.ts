import { google } from '@ai-sdk/google';
import { embed } from 'ai';

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel('text-embedding-004', { outputDimensionality: 256, taskType: 'RETRIEVAL_DOCUMENT' }),
    value: text,
  });
  return embedding;
} 
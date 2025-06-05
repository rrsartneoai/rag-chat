import { NextRequest } from 'next/server';
import { google } from '@ai-sdk/google';
import { embed, generateText } from 'ai';
import { chunkText } from '@/lib/chunkText';
import { sampleText } from '@/lib/sampleData';
import { embedText } from '@/lib/embedText';
import { VectorStore } from '@/lib/vectorStore';

// Inicjalizacja magazynu embeddingów (na start: in-memory, na zimno)
const chunks = chunkText(sampleText, 200);
let store: VectorStore | null = null;

async function getStore() {
  if (!store) {
    store = new VectorStore();
    // Precompute embeddingi dla wszystkich chunków
    const entries = await Promise.all(
      chunks.map(async chunk => ({
        chunk,
        embedding: await embedText(chunk),
      }))
    );
    store.addMany(entries);
  }
  return store;
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== 'string') {
    return new Response(JSON.stringify({ error: 'Brak zapytania' }), { status: 400 });
  }

  // Embedding zapytania
  const queryEmbedding = await embedText(query);
  const store = await getStore();
  const nearest = store.findNearest(queryEmbedding, 3);
  const context = nearest.map(e => e.chunk).join('\n');

  // Generowanie odpowiedzi przez Gemini Flash
  const { text: answer } = await generateText({
    model: google('gemini-1.5-flash-latest'),
    system: 'Jesteś pomocnym asystentem. Odpowiadaj na podstawie kontekstu.',
    prompt: `Kontekst:\n${context}\n\nPytanie:\n${query}\n\nOdpowiedź:`,
  });

  return Response.json({ answer, context });
} 
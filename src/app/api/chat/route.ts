import { NextRequest } from 'next/server';
import { google } from '@ai-sdk/google';
import { embed, generateText } from 'ai';
import { chunkText } from '@/lib/chunkText';
import { sampleText } from '@/lib/sampleData';
import { embedText } from '@/lib/embedText';
import { VectorStore } from '@/lib/vectorStore';
import pdfParse from 'pdf-parse';

// Domyślny magazyn embeddingów (sampleText)
const defaultChunks = chunkText(sampleText, 200);
let defaultStore: VectorStore | null = null;

async function getStore(chunks: string[]) {
  const store = new VectorStore();
  const entries = await Promise.all(
    chunks.map(async chunk => ({
      chunk,
      embedding: await embedText(chunk),
    }))
  );
  store.addMany(entries);
  return store;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const query = body.query as string;
  const fileContent = body.fileContent as string | undefined;
  const filePdfBase64 = body.filePdfBase64 as string | undefined;

  // Jeśli jest plik, użyj go jako źródła wiedzy
  let store: VectorStore;
  let contextChunks: string[];
  if (filePdfBase64 && filePdfBase64.length > 0) {
    // Parsowanie PDF
    const pdfBuffer = Buffer.from(filePdfBase64, 'base64');
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;
    contextChunks = chunkText(pdfText, 200);
    store = await getStore(contextChunks);
  } else if (fileContent && fileContent.trim().length > 0) {
    contextChunks = chunkText(fileContent, 200);
    store = await getStore(contextChunks);
  } else {
    if (!defaultStore) defaultStore = await getStore(defaultChunks);
    store = defaultStore;
    contextChunks = defaultChunks;
  }

  // Embedding zapytania
  const queryEmbedding = await embedText(query);
  // Retrieval: najbliższe fragmenty
  const nearest = store.findNearest(queryEmbedding, 3);
  const context = nearest.map(e => e.chunk).join('\n---\n');

  // Prompt do LLM
  const prompt = `Odpowiedz na pytanie na podstawie poniższych fragmentów tekstu. Jeśli nie ma odpowiedzi w kontekście, napisz "Nie wiem".\n\nKontekst:\n${context}\n\nPytanie: ${query}\nOdpowiedź:`;

  const { text: answer } = await generateText({
    model: google('gemini-1.5-flash-latest'),
    prompt,
    maxTokens: 256,
  });

  return Response.json({ answer, context });
} 
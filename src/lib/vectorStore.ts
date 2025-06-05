export type VectorEntry = {
  chunk: string;
  embedding: number[];
};

export class VectorStore {
  private store: VectorEntry[] = [];

  add(entry: VectorEntry) {
    this.store.push(entry);
  }

  addMany(entries: VectorEntry[]) {
    this.store.push(...entries);
  }

  // Zwraca N najbliższych chunków do zapytania
  findNearest(queryEmbedding: number[], topN: number = 3): VectorEntry[] {
    return this.store
      .map(entry => ({
        ...entry,
        similarity: cosineSimilarity(queryEmbedding, entry.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);
  }
}

// Funkcja cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
} 
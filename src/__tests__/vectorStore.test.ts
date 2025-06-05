import { VectorStore, cosineSimilarity } from '../lib/vectorStore';

describe('cosineSimilarity', () => {
  it('zwraca 1 dla identycznych wektorów', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });
  it('zwraca 0 dla ortogonalnych', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe('VectorStore', () => {
  it('dodaje i znajduje najbliższe embeddingi', () => {
    const store = new VectorStore();
    store.add({ chunk: 'A', embedding: [1, 0] });
    store.add({ chunk: 'B', embedding: [0, 1] });
    const nearest = store.findNearest([0.9, 0.1], 1);
    expect(nearest[0].chunk).toBe('A');
  });
}); 
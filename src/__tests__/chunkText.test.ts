import { chunkText } from '../lib/chunkText';
import { sampleText } from '../lib/sampleData';

describe('chunkText', () => {
  it('dzieli tekst na fragmenty o maksymalnej długości', () => {
    const chunks = chunkText(sampleText, 100);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
  });

  it('nie łamie słów', () => {
    const chunks = chunkText(sampleText, 50);
    for (const chunk of chunks) {
      expect(chunk).not.toMatch(/\s{2,}/);
      expect(chunk).not.toMatch(/\s$/);
    }
  });
}); 
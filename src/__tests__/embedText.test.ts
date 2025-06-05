import { embedText } from '../lib/embedText';

const fragments = [
  'Polska, oficjalnie Rzeczpospolita Polska, to kraj położony w Europie Środkowej.',
  'Granicy z Niemcami, Czechami, Słowacją, Ukrainą, Białorusią, Litwą oraz Rosją.',
];

describe('embedText', () => {
  it('zwraca embeddingi dla każdego fragmentu', async () => {
    const embeddings = await Promise.all(fragments.map(f => embedText(f)));
    expect(embeddings.length).toBe(fragments.length);
    for (const emb of embeddings) {
      expect(Array.isArray(emb)).toBe(true);
      expect(typeof emb[0]).toBe('number');
      expect(emb.length).toBeGreaterThan(10); // embedding powinien mieć sensowną długość
    }
  });
}); 
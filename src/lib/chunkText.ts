export function chunkText(text: string, maxLength: number = 100): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).trim().length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk += ' ' + word;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
} 
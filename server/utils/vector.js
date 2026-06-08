/**
 * Cosine similarity between two embedding vectors.
 * OpenAI embeddings are L2-normalized, so this equals the dot product.
 * Returns null if vectors are missing or length-mismatched.
 */
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return null;
  }
  if (a.length !== b.length) {
    return null;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) {
    return null;
  }

  return dot / denom;
}

module.exports = { cosineSimilarity };

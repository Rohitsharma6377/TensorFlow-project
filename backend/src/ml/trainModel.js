// Offline training stub. In production, aggregate interactions and train a proper model.
// This file can be executed as a script with `node src/ml/trainModel.js`.

const fs = require('fs');
const path = require('path');
const { getProductEmbedding } = require('./recommendService');

(async function main() {
  try {
    // In a real pipeline, collect interactions and train embeddings.
    // Here, we simply ensure embedding store exists and exit.
    const embDir = path.join(__dirname, 'embeddings');
    if (!fs.existsSync(embDir)) fs.mkdirSync(embDir, { recursive: true });
    console.log('Embeddings store prepared at', embDir);
  } catch (err) {
    console.error('Training stub failed:', err);
    process.exit(1);
  }
})();

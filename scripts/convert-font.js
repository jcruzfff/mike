import fs from 'fs';
import ttf2woff2 from 'ttf2woff2';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '../public/fonts/MonumentExtended-Regular.otf');
const outputPath = join(__dirname, '../public/fonts/MonumentExtended-Regular.woff2');

// Read the input font file
const input = fs.readFileSync(inputPath);

// Convert to WOFF2
const output = ttf2woff2(input);

// Write the output
fs.writeFileSync(outputPath, output);

console.log('✅ Font converted successfully!'); 
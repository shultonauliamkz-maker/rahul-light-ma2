import fs from 'fs';
import path from 'path';
import { convertFile } from '../server/engine/converter.js';

const srcPath = 'C:/Users/Aul/Downloads/AULIA MM/alfacom@pixsel_11_ch@11_ch.xml';
const buf = fs.readFileSync(srcPath);

const res = convertFile('alfacom@pixsel_11_ch@11_ch.xml', buf, {
  targetVersion: '3.2.2.16',
  mode: 'auto'
});

console.log('Output File Name:', res.outputFileName);
console.log('Logs:');
res.logs.forEach(l => console.log('  -', l));

// 1. Save to test-files
fs.writeFileSync(path.join('d:/DOWNGRADE MA2/test-files', res.outputFileName), res.convertedBuffer);

// 2. Save directly to grandMA2 v3.2.2 library
const targetDir = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.2.2/library';
try {
  fs.writeFileSync(path.join(targetDir, res.outputFileName), res.convertedBuffer);
  console.log(`Successfully placed "${res.outputFileName}" directly into grandMA2 v3.2.2 library!`);
} catch(err) {
  console.error('Copy to gma2_V_3.2.2 library error:', err.message);
}

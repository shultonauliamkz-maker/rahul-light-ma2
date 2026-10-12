import fs from 'fs';
import { convertFile } from './engine/converter.js';

const buf = fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz');
const res = convertFile('adella revisi 1.show.gz', buf, { targetVersion: '3.2.2.16' });

console.log('Result fileType:', res.fileType);
console.log('Result outputFileName:', res.outputFileName);
console.log('Result originalSize:', res.originalSize, 'convertedSize:', res.convertedSize);
console.log('Result logs:', res.logs);

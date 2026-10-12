import fs from 'fs';
import { detectFileType } from './engine/analyzer.js';

const buf = fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz');
console.log('detectFileType for adella revisi 1.show.gz:', detectFileType('adella revisi 1.show.gz', buf));
console.log('detectFileType for adella.show:', detectFileType('adella.show', buf));

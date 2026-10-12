import fs from 'fs';
import { convertFile } from './engine/converter.js';

const origBuf = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\parled_original.xml');
const res = convertFile('alfacom@led_parled_(a)@8_ch_(a).xml', origBuf, {
  targetVersion: '3.2.2.16',
  sourceVersion: '3.9.61.0',
  mode: 'auto'
});

console.log('--- CONVERTED RESULT ---');
console.log('Output file name:', res.outputFileName);
console.log('Integrity:', res.importCheck.fileIntegrity);
console.log('Structure:', res.importCheck.structureValidation);
console.log('Target Compat:', res.importCheck.targetCompatibility);
console.log('Unsupported Count:', res.importCheck.unsupportedCommandsCount);
console.log('Missing Dep Count:', res.importCheck.missingDependenciesCount);
console.log('Warnings count:', res.importCheck.warnings.length);
console.log('Retained Data:', res.importCheck.retainedData);
console.log('\n--- DIAGNOSTIC REPORT TEXT ---');
console.log(res.diagnosticReportText);

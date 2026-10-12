import fs from 'fs';
import zlib from 'zlib';

const buf = zlib.gunzipSync(fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz'));

console.log('Buffer length:', buf.length);

// Let's find fixture type references, channel ranges, and embedded strings
// Search for fixture types or manufacturers
const fixtures = [];
let idx = 0;
while ((idx = buf.indexOf('FixtureType', idx)) !== -1) {
  fixtures.push(idx);
  idx += 11;
}
console.log('Occurrences of FixtureType:', fixtures.length, fixtures.slice(0, 10));

// Search for macro text
const macroTexts = [];
idx = 0;
while ((idx = buf.indexOf('Macroline', idx)) !== -1) {
  macroTexts.push(idx);
  idx += 9;
}
console.log('Occurrences of Macroline:', macroTexts.length);

// Search for sequences
const sequences = [];
idx = 0;
while ((idx = buf.indexOf('CSequence', idx)) !== -1) {
  sequences.push(idx);
  idx += 9;
}
console.log('Occurrences of CSequence:', sequences.length);

// Search for effects
const effects = [];
idx = 0;
while ((idx = buf.indexOf('CEffect', idx)) !== -1) {
  effects.push(idx);
  idx += 7;
}
console.log('Occurrences of CEffect:', effects.length);

// Let's check around the first FixtureType occurrence
if (fixtures.length > 0) {
  const off = fixtures[0];
  console.log('Context around FixtureType 0:');
  console.log(buf.slice(off - 32, off + 96).toString('latin1'));
}

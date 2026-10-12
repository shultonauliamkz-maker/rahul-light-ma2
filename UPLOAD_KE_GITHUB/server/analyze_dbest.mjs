import fs from 'fs';

const buf = fs.readFileSync('C:/Users/Aul/Downloads/dbest.show/dbest.show');
console.log('Size:', buf.length);

// Scan for all occurrences of 'MA DATA'
let maDataOffsets = [];
let idx = 0;
while ((idx = buf.indexOf('MA DATA', idx)) !== -1) {
  maDataOffsets.push(idx);
  idx += 7;
}
console.log('MA DATA occurrences at offsets:', maDataOffsets);

// Scan for occurrences of '<?xml'
let xmlOffsets = [];
idx = 0;
while ((idx = buf.indexOf('<?xml', idx)) !== -1) {
  xmlOffsets.push(idx);
  idx += 5;
}
console.log('<?xml occurrences at offsets:', xmlOffsets);

// Scan for patterns
const patterns = ['Fixture', 'Sequence', 'Preset', 'Layer', 'Patch', 'Executor', 'Cue'];
for (const p of patterns) {
  let count = 0;
  idx = 0;
  while ((idx = buf.indexOf(p, idx)) !== -1) {
    count++;
    idx += p.length;
  }
  console.log(`Count of "${p}":`, count);
}

// Print some info on offsets of MA DATA
for (const off of maDataOffsets) {
  console.log(`Offset ${off}:`);
  console.log('  Ver bytes:', buf[off + 8], buf[off + 9], buf[off + 10], buf[off + 11]);
  console.log('  Bytes 12..24:', buf.slice(off + 12, off + 24).toString('hex'));
}

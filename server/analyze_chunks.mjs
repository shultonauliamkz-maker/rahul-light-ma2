import fs from 'fs';
import zlib from 'zlib';

function load(p) {
  const b = fs.readFileSync(p);
  return (b[0] === 0x1f && b[1] === 0x8b) ? zlib.gunzipSync(b) : b;
}

const v32 = load('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.2.2/shows/bikin pacht.show.gz');
const v37 = load('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/shows/sv.show.gz');
const v39 = load('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.9.61/shows/09.show.gz');
const adella = load('C:/Users/Aul/Downloads/adella revisi 1.show.gz');

console.log('Comparing showfile structures:');
[
  ['v3.2 bikin pacht', v32],
  ['v3.7 sv', v37],
  ['v3.9 09', v39],
  ['adella 3.9', adella]
].forEach(([name, buf]) => {
  console.log(`\n=== ${name} (${buf.length} bytes) ===`);
  // Look at first 256 bytes as uint32 words
  const words = [];
  for (let i = 0; i < Math.min(256, buf.length); i += 4) {
    words.push({ offset: i, val: buf.readUInt32LE(i), hex: buf.slice(i, i + 4).toString('hex') });
  }
  // Print some non-zero words
  console.log('Header words:');
  words.slice(0, 32).forEach(w => {
    console.log(`  +${w.offset.toString().padStart(3)}: 0x${w.hex} (${w.val})`);
  });
});

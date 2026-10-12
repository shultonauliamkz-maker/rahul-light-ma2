import fs from 'fs';
import zlib from 'zlib';

function load(p) {
  const b = fs.readFileSync(p);
  return (b[0] === 0x1f && b[1] === 0x8b) ? zlib.gunzipSync(b) : b;
}

const v32 = load('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.2.2/shows/bikin pacht.show.gz');
const adella = load('C:/Users/Aul/Downloads/adella revisi 1.show.gz');

console.log('v32 total:', v32.length, 'adella total:', adella.length);

// Look for where "bikin pacht" finishes its header.
// In v32, where does the first table or class definition start?
// Let's search for classes or non-zero data
function inspectStructure(name, buf) {
  console.log(`\n=== Analyzing ${name} ===`);
  // Look for sections separated by nulls or markers
  let nonZeroStart = -1;
  for (let i = 512; i < 2048; i++) {
    if (buf[i] !== 0) {
      nonZeroStart = i;
      break;
    }
  }
  console.log('First non-zero byte after 512 at offset:', nonZeroStart);
  console.log('Hex around offset:', buf.slice(nonZeroStart, nonZeroStart + 64).toString('hex'));
}

inspectStructure('v3.2 bikin pacht', v32);
inspectStructure('adella 3.9', adella);

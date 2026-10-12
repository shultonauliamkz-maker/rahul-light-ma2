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

[
  ['v3.2 bikin pacht', v32],
  ['v3.7 sv', v37],
  ['v3.9 09', v39],
  ['adella 3.9', adella]
].forEach(([name, buf]) => {
  console.log(`\n=== ${name} Offsets 128..400 ===`);
  for (let i = 128; i < 400; i += 16) {
    const chunk = buf.slice(i, i + 16);
    let hex = chunk.toString('hex').match(/.{1,2}/g).join(' ');
    let ascii = '';
    for (let j = 0; j < chunk.length; j++) {
      const c = chunk[j];
      ascii += (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
    }
    console.log(`+${i.toString().padStart(4)}: ${hex.padEnd(48)} | ${ascii}`);
  }
});

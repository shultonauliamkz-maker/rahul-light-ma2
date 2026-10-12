import fs from 'fs';
import zlib from 'zlib';

function loadShow(path) {
  const raw = fs.readFileSync(path);
  if (raw[0] === 0x1f && raw[1] === 0x8b) {
    return zlib.gunzipSync(raw);
  }
  return raw;
}

// Compare a v3.2.2 native show with a v3.9.61 native show
const v322Show = loadShow('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.2.2/shows/bikin pacht.show.gz');
const v37Show = loadShow('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/shows/sv.show.gz');
const v39Show = loadShow('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.9.61/shows/09.show.gz');

console.log('v3.2.2 length:', v322Show.length);
console.log('v3.7 length:', v37Show.length);
console.log('v3.9 length:', v39Show.length);

function dumpHeader(name, buf) {
  console.log(`\n=== Header of ${name} ===`);
  console.log('Hex 0..64:', buf.slice(0, 64).toString('hex'));
  console.log('Hex 64..128:', buf.slice(64, 128).toString('hex'));
  console.log('Hex 128..192:', buf.slice(128, 192).toString('hex'));
  
  // Look for text strings in first 512 bytes
  let str = '';
  for (let i = 0; i < Math.min(512, buf.length); i++) {
    const c = buf[i];
    str += (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
  }
  console.log('ASCII 0..512:\n' + str);
}

dumpHeader('v3.2.2 bikin pacht', v322Show);
dumpHeader('v3.7 sv', v37Show);
dumpHeader('v3.9 09', v39Show);

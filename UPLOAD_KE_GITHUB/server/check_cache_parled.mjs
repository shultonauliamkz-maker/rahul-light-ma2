import fs from 'fs';

const cachePath = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library\\_fixture_type_cache_3_2.tmp';
const buf = fs.readFileSync(cachePath);
const searchStr = 'alfacom@led_parled';
const idx = buf.indexOf(Buffer.from(searchStr));

if (idx !== -1) {
  console.log('Found alfacom@led_parled at:', idx);
  const slice = buf.subarray(idx - 10, idx + 150);
  console.log('Hex:', slice.toString('hex'));
  console.log('String:', slice.toString('latin1'));
} else {
  console.log('NOT FOUND in cache!');
}

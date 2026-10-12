import fs from 'fs';

const cachePath = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library\\_fixture_type_cache_3_2.tmp';
const buf = fs.readFileSync(cachePath);
const searchStr = 'alfacom@lunar_300_16_ch';
const idx = buf.indexOf(Buffer.from(searchStr));

if (idx !== -1) {
  console.log('Found alfacom at:', idx);
  const slice = buf.subarray(idx - 10, idx + 150);
  console.log('Hex:', slice.toString('hex'));
  console.log('String:', slice.toString('latin1'));
}

// Also let's inspect a standard fixture entry to compare
const stdSearch = 'showtec@spectral_260_rgb';
const stdIdx = buf.indexOf(Buffer.from(stdSearch));
if (stdIdx !== -1) {
  console.log('\nFound standard at:', stdIdx);
  const sliceStd = buf.subarray(stdIdx - 10, stdIdx + 150);
  console.log('Std Hex:', sliceStd.toString('hex'));
  console.log('Std String:', sliceStd.toString('latin1'));
}

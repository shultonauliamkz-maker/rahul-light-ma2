import fs from 'fs';
import zlib from 'zlib';

const showPath = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\shows\\sv.show.gz';
const buf = fs.readFileSync(showPath);
console.log('Magic bytes:', buf.slice(0, 16));
try {
  const decomp = zlib.gunzipSync(buf);
  console.log('Decompressed len:', decomp.length);
  console.log('First 200 chars:', decomp.slice(0, 200).toString('latin1'));
} catch (e) {
  console.log('Gunzip error:', e.message);
  console.log('Raw first 200 chars:', buf.slice(0, 200).toString('latin1'));
}

import fs from 'fs';
import zlib from 'zlib';

const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';
const files = fs.readdirSync(libDir).filter(f => f.endsWith('.xmlp'));

let foundMacroRate = 0;
let foundSample = null;

for (const f of files) {
  try {
    const buf = fs.readFileSync(`${libDir}/${f}`);
    const xml = zlib.gunzipSync(buf).toString('utf-8');
    if (xml.includes('COLORMIXMACRORATE')) {
      foundMacroRate++;
      if (!foundSample) foundSample = f;
    }
  } catch {}
}

console.log(`Fixtures with COLORMIXMACRORATE: ${foundMacroRate}`);
if (foundSample) console.log('Sample fixture:', foundSample);

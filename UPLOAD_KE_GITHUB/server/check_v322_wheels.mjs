import fs from 'fs';
import zlib from 'zlib';

const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';
const files = fs.readdirSync(libDir).filter(f => f.endsWith('.xmlp')).slice(0, 30);

for (const file of files) {
  const buf = fs.readFileSync(`${libDir}/${file}`);
  try {
    const decomp = zlib.gunzipSync(buf).toString('utf-8');
    if (decomp.includes('<Slot')) {
      const match = decomp.match(/<Wheels[\s\S]*?<\/Wheels>/i);
      if (match) {
        console.log(`--- Wheel from ${file} ---`);
        console.log(match[0].slice(0, 800));
        break;
      }
    }
  } catch {}
}

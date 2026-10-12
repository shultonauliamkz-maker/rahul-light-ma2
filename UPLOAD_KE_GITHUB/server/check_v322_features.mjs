import fs from 'fs';
import zlib from 'zlib';

const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';
const files = fs.readdirSync(libDir).filter(f => f.endsWith('.xmlp')).slice(0, 50);

let foundRdm = 0;
let foundVFB = 0;
for (const file of files) {
  const buf = fs.readFileSync(`${libDir}/${file}`);
  try {
    const decomp = zlib.gunzipSync(buf).toString('utf-8');
    if (decomp.includes('RdmNotification')) foundRdm++;
    if (decomp.includes('VirtualFunctionBlocks')) foundVFB++;
  } catch {}
}

console.log(`Checked ${files.length} fixtures in v3.2.2 library.`);
console.log(`Fixtures with RdmNotification: ${foundRdm}`);
console.log(`Fixtures with VirtualFunctionBlocks: ${foundVFB}`);

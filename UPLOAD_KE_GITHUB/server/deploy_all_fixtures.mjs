import fs from 'fs';
import path from 'path';
import { convertFile } from './engine/converter.js';

const srcDir = 'C:\\Users\\Aul\\Downloads\\AULIA MM';
const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.xml'));
console.log('Converting and deploying all fixtures from AULIA MM:', files);

for (const f of files) {
  const buf = fs.readFileSync(path.join(srcDir, f));
  const res = convertFile(f, buf, { targetVersion: '3.2.2.16', mode: 'auto' });
  const outPath = path.join(libDir, res.outputFileName);
  fs.writeFileSync(outPath, res.convertedBuffer);
  console.log(`Deployed -> ${res.outputFileName} (${res.convertedSize} bytes)`);
}

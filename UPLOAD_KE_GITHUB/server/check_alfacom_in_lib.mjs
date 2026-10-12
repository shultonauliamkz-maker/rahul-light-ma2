import fs from 'fs';

const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';
const files = fs.readdirSync(libDir).filter(f => f.toLowerCase().includes('alfacom'));
console.log('Alfacom files in library:', files);

for (const f of files) {
  const stat = fs.statSync(`${libDir}/${f}`);
  console.log(`${f} -> Size: ${stat.size}, Modified: ${stat.mtime.toISOString()}`);
}

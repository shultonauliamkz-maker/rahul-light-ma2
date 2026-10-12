import fs from 'fs';

const base = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.7';
for (const f of ['temp_data', 'temp_data.0']) {
  const p = `${base}/${f}`;
  if (fs.existsSync(p)) {
    const s = fs.statSync(p);
    console.log(`${f}: size = ${s.size}, mtime = ${s.mtime}`);
  }
}

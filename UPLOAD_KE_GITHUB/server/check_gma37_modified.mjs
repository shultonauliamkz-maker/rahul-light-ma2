import fs from 'fs';
import path from 'path';

const dir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.7';
const files = fs.readdirSync(dir).map(f => {
  const p = path.join(dir, f);
  try {
    const s = fs.statSync(p);
    return { name: f, isDir: s.isDirectory(), size: s.size, mtime: s.mtime };
  } catch { return null; }
}).filter(Boolean).sort((a, b) => b.mtime - a.mtime);

console.log('Recent files in gma2_V_3.7:');
files.slice(0, 15).forEach(f => {
  console.log(`${f.mtime.toISOString()} | ${f.isDir ? 'DIR ' : 'FILE'} | ${f.size.toString().padStart(10)} bytes | ${f.name}`);
});

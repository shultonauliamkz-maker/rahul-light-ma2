import fs from 'fs';
import path from 'path';

const dl = 'C:\\Users\\Aul\\Downloads';
const files = fs.readdirSync(dl).map(f => {
  const p = path.join(dl, f);
  try {
    const s = fs.statSync(p);
    return { name: f, isDir: s.isDirectory(), size: s.size, mtime: s.mtime };
  } catch { return null; }
}).filter(Boolean).sort((a, b) => b.mtime - a.mtime);

console.log('Top 20 most recent files in Downloads:');
files.slice(0, 20).forEach(f => {
  console.log(`${f.mtime.toISOString()} | ${f.isDir ? 'DIR ' : 'FILE'} | ${f.size.toString().padStart(10)} bytes | ${f.name}`);
});

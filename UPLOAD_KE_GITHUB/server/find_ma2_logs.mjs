import fs from 'fs';
import path from 'path';

const dirs = [
  'C:\\ProgramData\\MA Lighting Technologies',
  'C:\\Users\\Aul\\AppData\\Local\\MA Lighting Technologies',
  'C:\\Users\\Aul\\AppData\\Roaming\\MA Lighting Technologies'
];

function findLogs(dir) {
  const res = [];
  try {
    if (!fs.existsSync(dir)) return res;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      try {
        const s = fs.statSync(full);
        if (s.isDirectory()) res.push(...findLogs(full));
        else if (f.endsWith('.log') || f.endsWith('.txt') || f.includes('log') || f.includes('crash')) {
          res.push({ path: full, size: s.size, mtime: s.mtime });
        }
      } catch {}
    }
  } catch {}
  return res;
}

for (const d of dirs) {
  console.log(`Logs in ${d}:`, findLogs(d));
}

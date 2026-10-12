import fs from 'fs';
import path from 'path';

function findRecentFiles(dir, maxAgeMinutes = 30) {
  const results = [];
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results.push(...findRecentFiles(full, maxAgeMinutes));
        } else {
          const age = (Date.now() - stat.mtimeMs) / (1000 * 60);
          if (age < maxAgeMinutes) {
            results.push({ path: full, size: stat.size, mtime: stat.mtime, ageMin: Math.round(age) });
          }
        }
      } catch {}
    }
  } catch {}
  return results;
}

const recent = findRecentFiles('C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2', 60);
console.log('Recent files:', JSON.stringify(recent, null, 2));

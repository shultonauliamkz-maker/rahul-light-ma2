import fs from 'fs';
import path from 'path';

function findRecentFiles(dir, minutes = 60) {
  const results = [];
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results.push(...findRecentFiles(full, minutes));
        } else {
          const age = (Date.now() - stat.mtimeMs) / (1000 * 60);
          if (age < minutes) {
            results.push({ path: full, size: stat.size, mtime: stat.mtime, ageMin: Math.round(age * 10) / 10 });
          }
        }
      } catch {}
    }
  } catch {}
  return results;
}

const recent = findRecentFiles('C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2', 60);
console.log('Recent in gma2_V_3.2.2:', JSON.stringify(recent, null, 2));

const dlRecent = findRecentFiles('C:\\Users\\Aul\\Downloads', 60);
console.log('Recent in Downloads:', JSON.stringify(dlRecent.slice(0, 10), null, 2));

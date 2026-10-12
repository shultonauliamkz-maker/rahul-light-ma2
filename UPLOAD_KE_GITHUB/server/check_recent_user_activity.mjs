import fs from 'fs';
import path from 'path';

function getRecent(dir, minutes = 15) {
  try {
    return fs.readdirSync(dir)
      .map(f => {
        const full = path.join(dir, f);
        try {
          const s = fs.statSync(full);
          return { name: f, full, mtime: s.mtime, size: s.size, ageMin: (Date.now() - s.mtimeMs) / (1000 * 60) };
        } catch { return null; }
      })
      .filter(x => x && x.ageMin < minutes)
      .sort((a, b) => a.ageMin - b.ageMin);
  } catch { return []; }
}

console.log('Recent in Downloads:');
console.log(getRecent('C:\\Users\\Aul\\Downloads', 15));

console.log('Recent in Downloads\\AULIA MM:');
console.log(getRecent('C:\\Users\\Aul\\Downloads\\AULIA MM', 15));

console.log('Recent in gma2_V_3.2.2\\library:');
console.log(getRecent('C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library', 15));

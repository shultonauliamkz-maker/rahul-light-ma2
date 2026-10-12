import fs from 'fs';
import path from 'path';

function findXsd(dir) {
  const res = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      try {
        const s = fs.statSync(full);
        if (s.isDirectory()) res.push(...findXsd(full));
        else if (f.toLowerCase().endsWith('.xsd')) res.push(full);
      } catch {}
    }
  } catch {}
  return res;
}

console.log('XSD files in C:\\ProgramData\\MA Lighting Technologies:');
console.log(findXsd('C:\\ProgramData\\MA Lighting Technologies'));

console.log('XSD files in C:\\Program Files\\MA Lighting Technologies:');
console.log(findXsd('C:\\Program Files\\MA Lighting Technologies'));

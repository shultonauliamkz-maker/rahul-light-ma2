import fs from 'fs';
import path from 'path';

for (const ver of ['gma2_V_3.7', 'gma2_V_3.2.2']) {
  const root = `C:\\ProgramData\\MA Lighting Technologies\\grandma\\${ver}`;
  if (fs.existsSync(root)) {
    console.log(`\n=== Contents of ${root} ===`);
    const entries = fs.readdirSync(root);
    for (const e of entries) {
      const full = path.join(root, e);
      const isDir = fs.statSync(full).isDirectory();
      console.log(`  ${e} (${isDir ? 'DIR' : 'FILE'})`);
      if (['temp', 'reports', 'log', 'logs'].includes(e.toLowerCase())) {
        const subFiles = fs.readdirSync(full);
        console.log(`    -> Subfiles in ${e}:`, subFiles.slice(0, 10));
      }
    }
  }
}

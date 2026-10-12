import fs from 'fs';
import path from 'path';

const base = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2';
const filesToCheck = [
  'rahul_pos_temp_macro.xml',
  'rahul_pos_temp_layout.xml',
  'tempfile_createmacro.xml'
];

for (const f of filesToCheck) {
  const p = path.join(base, f);
  if (fs.existsSync(p)) {
    console.log(`=== ${f} ===`);
    const c = fs.readFileSync(p, 'utf-8');
    console.log(c.slice(0, 500));
  }
}

const ieDir = path.join(base, 'importexport');
if (fs.existsSync(ieDir)) {
  console.log(`=== importexport dir contents ===`, fs.readdirSync(ieDir));
}

import fs from 'fs';

const base = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.7';
for (const f of ['gma2_local_settings', 'gma2_netconfig', 'gma2_user']) {
  const p = `${base}/${f}`;
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p);
    console.log(`=== ${f} (${raw.length} bytes) ===`);
    let str = '';
    for (let i = 0; i < Math.min(1000, raw.length); i++) {
      const c = raw[i];
      str += (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
    }
    console.log(str.slice(0, 300));
  }
}

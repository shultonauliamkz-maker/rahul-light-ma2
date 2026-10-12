import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const baseDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma';
const versions = ['gma2_V_3.9.61', 'gma2_V_3.7', 'gma2_V_3.2.2'];

for (const v of versions) {
  const showDir = path.join(baseDir, v, 'shows');
  if (fs.existsSync(showDir)) {
    const files = fs.readdirSync(showDir);
    console.log(`=== ${v} (${files.length} files) ===`);
    const sample = files.filter(f => f.endsWith('.show.gz') || f.endsWith('.show')).slice(0, 5);
    for (const f of sample) {
      const fullPath = path.join(showDir, f);
      const stat = fs.statSync(fullPath);
      const raw = fs.readFileSync(fullPath);
      let decomp = raw;
      let isGz = false;
      if (raw[0] === 0x1f && raw[1] === 0x8b) {
        isGz = true;
        try { decomp = zlib.gunzipSync(raw); } catch (e) { decomp = null; }
      }
      let headerStr = decomp ? decomp.slice(0, 16).toString('latin1') : 'ERROR';
      let hasXml = decomp ? decomp.includes(Buffer.from('<?xml')) : false;
      let hasMaData = decomp ? decomp.slice(0, 8).toString('latin1') === 'MA DATA\0' : false;
      console.log(`  ${f}: ${stat.size} bytes (gz:${isGz}), uncompressed: ${decomp ? decomp.length : 'fail'}, header: ${JSON.stringify(headerStr)}, hasMaData: ${hasMaData}, hasXml: ${hasXml}`);
    }
  } else {
    console.log(`=== ${v} does NOT exist ===`);
  }
}

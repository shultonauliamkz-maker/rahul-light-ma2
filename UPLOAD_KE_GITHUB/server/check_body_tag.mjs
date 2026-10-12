import fs from 'fs';
import zlib from 'zlib';

const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';
const files = fs.readdirSync(libDir).filter(f => f.endsWith('.xmlp')).slice(0, 30);

let bodyOutsideModule = 0;
for (const f of files) {
  const buf = fs.readFileSync(`${libDir}/${f}`);
  try {
    const xml = zlib.gunzipSync(buf).toString('utf-8');
    // Check if <Body exists after </Modules>
    const modIdx = xml.indexOf('</Modules>');
    if (modIdx !== -1) {
      const rest = xml.slice(modIdx);
      if (rest.includes('<Body')) bodyOutsideModule++;
    }
  } catch {}
}

console.log(`Standard fixtures with <Body> outside <Modules>: ${bodyOutsideModule} / ${files.length}`);

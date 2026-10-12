import fs from 'fs';
import zlib from 'zlib';

const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';
const files = fs.readdirSync(libDir).filter(f => f.endsWith('.xmlp') || f.endsWith('.xml')).slice(0, 50);

let bomCount = 0;
for (const f of files) {
  const buf = fs.readFileSync(`${libDir}/${f}`);
  let head = buf.slice(0, 4);
  if (f.endsWith('.xmlp')) {
    try {
      const decomp = zlib.gunzipSync(buf);
      head = decomp.slice(0, 4);
    } catch {}
  }
  if (head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) {
    bomCount++;
  }
}

console.log(`BOM in standard v3.2.2 files: ${bomCount} / ${files.length}`);

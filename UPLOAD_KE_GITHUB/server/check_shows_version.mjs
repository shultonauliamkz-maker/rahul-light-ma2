import fs from 'fs';
import zlib from 'zlib';

const showsDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\shows';
if (fs.existsSync(showsDir)) {
  const files = fs.readdirSync(showsDir);
  console.log('Shows files:', files);
  for (const f of files.filter(x => x.endsWith('.show') || x.endsWith('.xml')).slice(0, 3)) {
    const p = `${showsDir}/${f}`;
    const buf = fs.readFileSync(p);
    let xml = '';
    try {
      xml = zlib.gunzipSync(buf).toString('utf-8');
    } catch {
      xml = buf.toString('utf-8');
    }
    const maMatch = xml.match(/<MA\b[^>]*>/i);
    console.log(`MA header in ${f}:`, maMatch ? maMatch[0] : 'no MA header');
  }
}

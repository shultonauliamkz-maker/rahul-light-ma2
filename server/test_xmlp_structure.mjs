import fs from 'fs';
import zlib from 'zlib';

const lib = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.7\\library';
if (fs.existsSync(lib)) {
  const xmlpFiles = fs.readdirSync(lib).filter(f => f.endsWith('.xmlp'));
  console.log(`Found ${xmlpFiles.length} .xmlp files in library.`);
  if (xmlpFiles.length > 0) {
    const f = xmlpFiles[0];
    const raw = fs.readFileSync(`${lib}/${f}`);
    const decomp = zlib.gunzipSync(raw);
    console.log(`Sample ${f}: decompressed length ${decomp.length}`);
    console.log('Header 0..32:', decomp.slice(0, 32).toString('latin1'));
    console.log('Includes <FixtureType:', decomp.includes('<FixtureType'));
  }
}

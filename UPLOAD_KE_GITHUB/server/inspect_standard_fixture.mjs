import fs from 'fs';
import zlib from 'zlib';

const stdFile = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library\\showtec@spectral_260_rgb@arc_1.xmlp';
if (fs.existsSync(stdFile)) {
  const buf = fs.readFileSync(stdFile);
  const decomp = zlib.gunzipSync(buf);
  const xmlIdx = decomp.indexOf('<?xml');
  const xmlStr = decomp.slice(xmlIdx !== -1 ? xmlIdx : 0).toString('utf-8');
  console.log('--- SHOWTEC SAMPLE (first 1000 chars) ---');
  console.log(xmlStr.slice(0, 1000));
  
  // Look for Instances in standard fixture
  const instMatch = xmlStr.match(/<Instances[\s\S]*?<\/Instances>/i);
  console.log('\n--- INSTANCES MATCH ---');
  console.log(instMatch ? instMatch[0] : 'NO INSTANCES TAG IN SHOWTEC!');
}

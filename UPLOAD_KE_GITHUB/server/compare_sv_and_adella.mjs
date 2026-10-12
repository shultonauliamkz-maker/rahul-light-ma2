import fs from 'fs';
import zlib from 'zlib';

const sv = zlib.gunzipSync(fs.readFileSync('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/shows/sv.show.gz'));
const adella = zlib.gunzipSync(fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz'));

console.log('sv length:', sv.length);
console.log('adella length:', adella.length);

// Let's check what XML is in sv!
const xmlIdx = sv.indexOf('<?xml');
console.log('XML index in sv:', xmlIdx);
if (xmlIdx !== -1) {
  const xmlPart = sv.slice(xmlIdx, xmlIdx + 1000).toString('utf-8');
  console.log('XML header in sv:\n', xmlPart);
}

import fs from 'fs';
import zlib from 'zlib';

const sv = zlib.gunzipSync(fs.readFileSync('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/shows/sv.show.gz'));

console.log('sv length:', sv.length);
console.log('Offset 0..8:', sv.slice(0, 8).toString('latin1'));
console.log('Version bytes 8..12:', sv[8], sv[9], sv[10], sv[11]);

// Let's see how much data is between 0 and 798689
console.log('Binary payload size:', 798689);
console.log('XML payload size:', sv.length - 798689);

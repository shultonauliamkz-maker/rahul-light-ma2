import fs from 'fs';
import zlib from 'zlib';

const buf = zlib.gunzipSync(fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz'));

console.log('Context around 425546:');
console.log(buf.slice(425500, 425650).toString('latin1'));

console.log('\nContext around 8298000..8300000:');
const tail = buf.slice(8297000, 8300685);
let s = '';
for (let i = 0; i < tail.length; i++) {
  const c = tail[i];
  s += (c >= 32 && c <= 126) ? String.fromCharCode(c) : ' ';
}
console.log(s.replace(/\s+/g, ' ').slice(0, 1000));

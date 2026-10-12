import fs from 'fs';

const buf = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\parled_user.xml');
console.log('First 60 bytes of parled_user:');
console.log(buf.slice(0, 60));
console.log('Hex:', buf.slice(0, 60).toString('hex'));
console.log('Latin1:', buf.slice(0, 60).toString('latin1'));

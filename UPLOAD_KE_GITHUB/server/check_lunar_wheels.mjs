import fs from 'fs';

const orig = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\lunar_original.xml', 'utf-8');
const match = orig.match(/<Wheels[\s\S]*?<\/Wheels>/i);
if (match) {
  console.log('--- Lunar Wheels (first 1200 chars) ---');
  console.log(match[0].slice(0, 1200));
}

import fs from 'fs';
import zlib from 'zlib';

const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';
const files = fs.readdirSync(libDir).filter(f => f.endsWith('.xmlp')).slice(0, 30);

let ftHasIndex = 0;
let modulesHasIndex = 0;
let instancesHasIndex = 0;

for (const f of files) {
  const buf = fs.readFileSync(`${libDir}/${f}`);
  try {
    const xml = zlib.gunzipSync(buf).toString('utf-8');
    if (/<FixtureType\b[^>]*\bindex=/i.test(xml)) ftHasIndex++;
    if (/<Modules\b[^>]*\bindex=/i.test(xml)) modulesHasIndex++;
    if (/<Instances\b[^>]*\bindex=/i.test(xml)) instancesHasIndex++;
  } catch {}
}

console.log(`Standard fixtures with <FixtureType index=...>: ${ftHasIndex} / ${files.length}`);
console.log(`Standard fixtures with <Modules index=...>: ${modulesHasIndex} / ${files.length}`);
console.log(`Standard fixtures with <Instances index=...>: ${instancesHasIndex} / ${files.length}`);

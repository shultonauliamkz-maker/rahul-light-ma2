import fs from 'fs';
import zlib from 'zlib';

const libDir = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library';
const files = fs.readdirSync(libDir).filter(f => f.endsWith('.xmlp')).slice(0, 50);

const allTagsInV322 = new Set();
for (const file of files) {
  const buf = fs.readFileSync(`${libDir}/${file}`);
  try {
    const decomp = zlib.gunzipSync(buf).toString('utf-8');
    const tags = decomp.match(/<([A-Z][a-zA-Z0-9_]*)\b/g) || [];
    tags.forEach(t => allTagsInV322.add(t));
  } catch {}
}

console.log('Known tags in v3.2.2 library (total ' + allTagsInV322.size + '):', [...allTagsInV322]);

const orig = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\lunar_original.xml', 'utf-8');
const lunarTags = new Set(orig.match(/<([A-Z][a-zA-Z0-9_]*)\b/g) || []);

console.log('\nTags in lunar:');
for (const tag of lunarTags) {
  const recognized = allTagsInV322.has(tag);
  console.log(`  ${tag}: ${recognized ? 'OK in v3.2.2' : 'MISSING / NEW IN v3.2.2!'}`);
}

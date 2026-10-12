import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const filePath = 'C:\\Users\\Aul\\Downloads\\adella revisi 1.show.gz';
const dirPath = 'C:\\Users\\Aul\\Downloads\\adella revisi 1.show';

if (fs.existsSync(filePath)) {
  const buf = fs.readFileSync(filePath);
  console.log(`adella revisi 1.show.gz size: ${buf.length}`);
  let raw = buf;
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    raw = zlib.gunzipSync(buf);
    console.log(`Decompressed size: ${raw.length}`);
  }
  console.log('Magic header:', raw.slice(0, 16).toString('latin1'));
  console.log('Header bytes 8..11:', raw[8], raw[9], raw[10], raw[11]);
  console.log('Bytes 136..139:', raw[136], raw[137], raw[138], raw[139]);

  // Check counts of keywords
  const keywords = ['Fixture', 'Sequence', 'Preset', 'Layer', 'Patch', 'Executor', 'Cue', 'Effect', 'Macro', 'Layout', 'Channel'];
  for (const kw of keywords) {
    let count = 0;
    let idx = 0;
    while ((idx = raw.indexOf(kw, idx)) !== -1) {
      count++;
      idx += kw.length;
    }
    console.log(`Count of "${kw}": ${count}`);
  }
}

if (fs.existsSync(dirPath)) {
  console.log(`\nDir ${dirPath} exists, contents:`, fs.readdirSync(dirPath));
}

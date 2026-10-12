import fs from 'fs';
import zlib from 'zlib';

const buf = zlib.gunzipSync(fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz'));

// Look for patterns of fixture names, preset names, sequence names, etc.
// In grandMA2 binary format, strings are often preceded by length or null-terminated.
// Let's search for names that appear repeatedly.

const names = [];
let i = 0;
while (i < buf.length) {
  // Check if there is an ASCII string of length between 3 and 50
  if (buf[i] >= 32 && buf[i] <= 126) {
    let start = i;
    while (i < buf.length && buf[i] >= 32 && buf[i] <= 126) {
      i++;
    }
    const len = i - start;
    if (len >= 4 && len <= 60) {
      const s = buf.slice(start, i).toString('latin1');
      names.push({ offset: start, str: s });
    }
  } else {
    i++;
  }
}

console.log(`Total string tokens: ${names.length}`);

// Filter for tokens that look like user programming (not C++ class names or symbols)
const systemTokens = new Set([
  'MA DATA', 'Showfile Created', 'UserProfile', 'Default', 'administrator', 'guest',
  'Camera', 'Bitmap', 'Universe', 'DMX', 'Parameter', 'Channel', 'Fixture'
]);

const userTokens = names.filter(n => {
  if (systemTokens.has(n.str)) return false;
  // Look for cues, presets, colors, positions, fixtures
  return /cue|dim|pos|col|gobo|beam|seq|group|look|song|intro|verse|chorus|adella|alfacom|sharp|beam|wash|par|led|mac|quantum|robe|clay/i.test(n.str);
});

console.log(`Found ${userTokens.length} user-programming tokens:`);
console.log(userTokens.slice(0, 50));

import fs from 'fs';
import zlib from 'zlib';

const buf = zlib.gunzipSync(fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz'));

console.log('Total buffer length:', buf.length);

// Scan for any XML chunks in the entire 8.3 MB
let xmlMatches = [];
let idx = 0;
while ((idx = buf.indexOf('<?xml', idx)) !== -1) {
  xmlMatches.push(idx);
  idx += 5;
}
console.log('Occurrences of <?xml:', xmlMatches);

idx = 0;
let maMatches = [];
while ((idx = buf.indexOf('<MA ', idx)) !== -1) {
  maMatches.push(idx);
  idx += 4;
}
console.log('Occurrences of <MA :', maMatches);

// Scan for ASCII strings with length >= 4
let strings = [];
let currentStr = '';
for (let i = 0; i < buf.length; i++) {
  const b = buf[i];
  if (b >= 32 && b <= 126) {
    currentStr += String.fromCharCode(b);
  } else {
    if (currentStr.length >= 6) {
      strings.push({ offset: i - currentStr.length, str: currentStr });
    }
    currentStr = '';
  }
}
console.log(`Found ${strings.length} strings of length >= 6.`);

// Sample strings: look for known grandMA2 classes, fixture names, etc.
const interesting = strings.filter(s => 
  s.str.includes('Fixture') ||
  s.str.includes('Layer') ||
  s.str.includes('Sequence') ||
  s.str.includes('Preset') ||
  s.str.includes('Macro') ||
  s.str.includes('Effect') ||
  s.str.includes('User') ||
  s.str.includes('Patch') ||
  s.str.includes('Beam') ||
  s.str.includes('Spot') ||
  s.str.includes('Wash') ||
  s.str.includes('Par')
);

console.log(`Interesting strings found: ${interesting.length}`);
console.log('First 40 interesting strings:', interesting.slice(0, 40));

// Also check strings at the end of the file
console.log('Last 20 strings overall:', strings.slice(-20));

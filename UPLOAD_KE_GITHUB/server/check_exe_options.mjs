import fs from 'fs';

const exe = 'C:\\Program Files\\MA Lighting Technologies\\grandma\\grandMA2 onPC 3.7.0.5\\gma2onpc.exe';
const buf = fs.readFileSync(exe);

const switches = [];
const strRegex = /-[a-zA-Z0-9_]+|\/[a-zA-Z0-9_]+/g;
let match;
const latin = buf.toString('latin1');

// Look for command line flags or startup options
const keywords = ['STARTUP', 'Startup', 'AUTOLOAD', 'autoload', 'CMD', 'cmd', 'TELNET', 'telnet', 'MACRO', 'macro'];
for (const kw of keywords) {
  let idx = 0;
  let count = 0;
  while ((idx = latin.indexOf(kw, idx)) !== -1 && count < 5) {
    switches.push({ kw, offset: idx, sample: latin.slice(Math.max(0, idx - 10), idx + 30).replace(/[^a-zA-Z0-9_\-\/\.: ]/g, ' ') });
    idx += kw.length;
    count++;
  }
}
console.log('Keywords found in gma2onpc.exe:', switches);

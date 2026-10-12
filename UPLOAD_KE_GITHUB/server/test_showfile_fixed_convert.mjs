import fs from 'fs';
import zlib from 'zlib';

const rawBuffer = fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz');
const isGzip = rawBuffer[0] === 0x1f && rawBuffer[1] === 0x8b;
const decompressed = isGzip ? zlib.gunzipSync(rawBuffer) : rawBuffer;

console.log('Source uncompressed size:', decompressed.length);
console.log('Header bytes 8..11:', decompressed[8], decompressed[9], decompressed[10], decompressed[11]);

// Let's patch version to 3.7.0.5 (targetInfo: major=3, minor=7, stream=0, sub=5)
const targetInfo = { major: 3, minor: 7, stream: 0, sub: 5 };
const origSub = decompressed[8];
const origStream = decompressed[9];
const origMinor = decompressed[10];
const origMajor = decompressed[11];

let patchedBuffer = Buffer.from(decompressed);

// 1. Index header
patchedBuffer[8] = targetInfo.sub;
patchedBuffer[9] = targetInfo.stream;
patchedBuffer[10] = targetInfo.minor;
patchedBuffer[11] = targetInfo.major;

// 2. Database payload root chunk (offset 136..139)
if (patchedBuffer.length >= 140) {
  patchedBuffer[136] = targetInfo.sub;
  patchedBuffer[137] = targetInfo.stream;
  patchedBuffer[138] = targetInfo.minor;
  patchedBuffer[139] = targetInfo.major;
}

// 3. Scan and patch revision headers
let additional = 0;
for (let i = 140; i < patchedBuffer.length - 4; i++) {
  if (
    patchedBuffer[i] === origSub &&
    patchedBuffer[i + 1] === origStream &&
    patchedBuffer[i + 2] === origMinor &&
    patchedBuffer[i + 3] === origMajor
  ) {
    patchedBuffer[i] = targetInfo.sub;
    patchedBuffer[i + 1] = targetInfo.stream;
    patchedBuffer[i + 2] = targetInfo.minor;
    patchedBuffer[i + 3] = targetInfo.major;
    additional++;
  }
}
console.log(`Patched offset 8, 136 + ${additional} additional revision headers.`);

const repacked = zlib.gzipSync(patchedBuffer, { level: 9 });
console.log('Repacked GZ size:', repacked.length);

// Compare uncompressed sizes
console.log('Are uncompressed sizes exactly equal?', decompressed.length === patchedBuffer.length);

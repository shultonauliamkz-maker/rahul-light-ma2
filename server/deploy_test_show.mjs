import fs from 'fs';
import zlib from 'zlib';

const rawBuffer = fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz');
const decompressed = zlib.gunzipSync(rawBuffer);

const targetInfo = { major: 3, minor: 7, stream: 0, sub: 5 };
const origSub = decompressed[8];
const origStream = decompressed[9];
const origMinor = decompressed[10];
const origMajor = decompressed[11];

let patchedBuffer = Buffer.from(decompressed);
patchedBuffer[8] = targetInfo.sub;
patchedBuffer[9] = targetInfo.stream;
patchedBuffer[10] = targetInfo.minor;
patchedBuffer[11] = targetInfo.major;

if (patchedBuffer.length >= 140) {
  patchedBuffer[136] = targetInfo.sub;
  patchedBuffer[137] = targetInfo.stream;
  patchedBuffer[138] = targetInfo.minor;
  patchedBuffer[139] = targetInfo.major;
}

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
  }
}

const repacked = zlib.gzipSync(patchedBuffer, { level: 9 });
const destGz = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/shows/adella_test_37.show.gz';
const destRaw = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/shows/adella_test_37.show';

fs.writeFileSync(destGz, repacked);
fs.writeFileSync(destRaw, patchedBuffer);

console.log('Deployed adella_test_37.show.gz (' + repacked.length + ' bytes) and .show (' + patchedBuffer.length + ' bytes) to gma2_V_3.7/shows/');

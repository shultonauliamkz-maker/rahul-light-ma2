import fs from 'fs';
import zlib from 'zlib';

const srcGz = fs.readFileSync('C:/Users/Aul/Downloads/adella revisi 1.show.gz');
const src = zlib.gunzipSync(srcGz);

const targetPath = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/shows/adella revisi 1_v3_2_2_16.show.gz';
const tgtGz = fs.existsSync(targetPath) ? fs.readFileSync(targetPath) : null;
const tgt = tgtGz ? zlib.gunzipSync(tgtGz) : null;

console.log('Source GZ length:', srcGz.length, 'Decompressed:', src.length);
if (tgt) {
  console.log('Target GZ length:', tgtGz.length, 'Decompressed:', tgt.length);
  
  // Find all byte differences between src and tgt
  let diffCount = 0;
  let diffOffsets = [];
  const minLen = Math.min(src.length, tgt.length);
  for (let i = 0; i < minLen; i++) {
    if (src[i] !== tgt[i]) {
      diffCount++;
      if (diffOffsets.length < 50) {
        diffOffsets.push({
          offset: i,
          srcHex: src[i].toString(16).padStart(2, '0'),
          tgtHex: tgt[i].toString(16).padStart(2, '0')
        });
      }
    }
  }
  console.log(`Total byte differences: ${diffCount} out of ${minLen} bytes`);
  console.log('First 50 diffs:', diffOffsets);
} else {
  console.log('Target file not found at', targetPath);
}

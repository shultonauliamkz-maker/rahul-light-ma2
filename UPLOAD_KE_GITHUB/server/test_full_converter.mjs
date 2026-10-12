import fs from 'fs';
import { convertFile } from './engine/converter.js';

const testFiles = [
  'C:\\Users\\Aul\\Downloads\\AULIA MM\\alfacom@lunar_300_16_ch@16_ch.xml',
  'C:\\Users\\Aul\\Downloads\\AULIA MM\\alfacom@pixsel_11_ch@11_ch.xml',
  'C:\\Users\\Aul\\Downloads\\AULIA MM\\alfacom@strobe_100_rgb@11_ch.xml',
  'C:\\Users\\Aul\\Downloads\\AULIA MM\\alfacom@led_parled_(a)@8_ch_(a).xml',
  'C:\\Users\\Aul\\Downloads\\AULIA MM\\alfacom@blind_4_cel@6_ch_(a).xml',
  'C:\\Users\\Aul\\Downloads\\AULIA MM\\alfacom@fresnel_cob@7_ch_(d).xml'
];

for (const f of testFiles) {
  if (fs.existsSync(f)) {
    const buf = fs.readFileSync(f);
    const fname = f.split('\\').pop();
    const result = convertFile(fname, buf, { targetVersion: '3.2.2.16', mode: 'auto' });
    console.log(`\n=== Testing ${fname} ===`);
    console.log(`Output: ${result.outputFileName} (${result.convertedSize} bytes)`);
    console.log(`Changes: ${result.modifiedFeatures.length}`);
    const warnings = result.logs.filter(l => l.includes('warning') || l.includes('notice'));
    if (warnings.length > 0) {
      console.log('Warnings:', warnings);
    } else {
      console.log('100% Clean XML! No warnings.');
    }
  }
}

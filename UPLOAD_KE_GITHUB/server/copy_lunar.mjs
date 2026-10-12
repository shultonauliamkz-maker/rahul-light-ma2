import fs from 'fs';

const convertedSrc = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library\\alfacom@lunar_300_16_ch_v3_2_2_16@16_ch.xml';
const originalSrc = 'C:\\Users\\Aul\\Downloads\\AULIA MM\\alfacom@lunar_300_16_ch@16_ch.xml';

fs.copyFileSync(convertedSrc, 'd:\\DOWNGRADE MA2\\server\\lunar_converted.xml');
fs.copyFileSync(originalSrc, 'd:\\DOWNGRADE MA2\\server\\lunar_original.xml');

console.log('Files copied successfully.');

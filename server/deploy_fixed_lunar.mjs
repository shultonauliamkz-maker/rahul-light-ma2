import fs from 'fs';

const fixedXml = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\lunar_test_fixed.xml', 'utf-8');
const targetPath = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library\\alfacom@lunar_300_16_ch_v3_2_2_16@16_ch.xml';

fs.writeFileSync(targetPath, fixedXml, 'utf-8');
console.log('Successfully wrote fixed XML to grandMA2 library:', targetPath);

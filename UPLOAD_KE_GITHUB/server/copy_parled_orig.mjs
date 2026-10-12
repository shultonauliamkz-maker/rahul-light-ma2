import fs from 'fs';

const origPath = 'C:\\Users\\Aul\\Downloads\\AULIA MM\\alfacom@led_parled_(a)@8_ch_(a).xml';
if (fs.existsSync(origPath)) {
  const orig = fs.readFileSync(origPath, 'utf-8');
  fs.writeFileSync('d:\\DOWNGRADE MA2\\server\\parled_original.xml', orig, 'utf-8');
  console.log('Original parled length:', orig.length);
} else {
  console.log('Original parled not found!');
}

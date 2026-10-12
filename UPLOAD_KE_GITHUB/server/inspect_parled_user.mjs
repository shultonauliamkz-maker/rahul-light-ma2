import fs from 'fs';
import { XMLValidator } from 'fast-xml-parser';

const p = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library\\alfacom@led_parled_(a)_v3_2_2_16@8_ch_(a).xml';
if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, 'utf-8');
  fs.writeFileSync('d:\\DOWNGRADE MA2\\server\\parled_user.xml', content, 'utf-8');
  console.log('Copied to parled_user.xml. Length:', content.length);
  
  const val = XMLValidator.validate(content);
  console.log('XML Validation:', val);
  
  // Check for Instance tag
  const instMatch = content.match(/<Instance[\s\S]*?>/gi);
  console.log('Instance tags:', instMatch);

  // Check for Module tag
  const modMatch = content.match(/<Module[\s\S]*?>/gi);
  console.log('Module tags:', modMatch);

  // Check FixtureType tag
  const ftMatch = content.match(/<FixtureType[\s\S]*?>/gi);
  console.log('FixtureType tag:', ftMatch);
} else {
  console.log('File does not exist:', p);
}

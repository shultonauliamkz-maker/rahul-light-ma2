import fs from 'fs';

const s = fs.readFileSync('C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.7\\gma2_settings');
console.log('Hex:\n', s.toString('hex'));
console.log('ASCII:\n', s.toString('latin1'));

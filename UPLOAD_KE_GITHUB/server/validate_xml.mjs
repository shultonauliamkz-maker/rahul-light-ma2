import fs from 'fs';
import { XMLValidator } from 'fast-xml-parser';

const conv = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\lunar_converted.xml', 'utf-8');
const result = XMLValidator.validate(conv);

console.log('Validation result for lunar_converted.xml:', result);

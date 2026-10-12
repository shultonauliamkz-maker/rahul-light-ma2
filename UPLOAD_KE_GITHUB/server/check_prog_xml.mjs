import fs from 'fs';

const progDir = 'C:\\Program Files\\MA Lighting Technologies\\grandma\\grandMA2 onPC 3.2.2.16';
const files = fs.readdirSync(progDir).filter(f => f.endsWith('.xml') || f.endsWith('.xsd'));
console.log('XML/XSD files in program dir:', files);

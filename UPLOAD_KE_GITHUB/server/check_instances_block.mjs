import fs from 'fs';

const orig = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\lunar_original.xml', 'utf-8');
const conv = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\lunar_converted.xml', 'utf-8');

const origMatches = orig.match(/.{0,50}<Instances[\s\S]*?<\/Instances>.{0,50}/i);
console.log('Original Instances block:');
console.log(origMatches ? origMatches[0] : 'None in orig');

const convMatches = conv.match(/.{0,50}<Instances[\s\S]*?<\/Instances>.{0,50}/i);
console.log('Converted Instances block:');
console.log(convMatches ? convMatches[0] : 'None in conv');

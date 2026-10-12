import fs from 'fs';

const orig = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\lunar_original.xml', 'utf-8');
const tags = orig.match(/<([A-Z][a-zA-Z0-9_]*)\b/g);
const uniqueTags = [...new Set(tags)];
console.log('Tags in lunar_original:', uniqueTags);

// Check if Instances or Instance exists anywhere
console.log('orig includes Instance:', orig.includes('Instance'));
console.log('orig includes Instances:', orig.includes('Instances'));

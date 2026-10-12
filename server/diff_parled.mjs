import fs from 'fs';
import * as diff from 'diff';

const orig = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\parled_original.xml', 'utf-8');
const user = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\parled_user.xml', 'utf-8');

const patch = diff.createPatch('parled', orig, user);
console.log(patch);

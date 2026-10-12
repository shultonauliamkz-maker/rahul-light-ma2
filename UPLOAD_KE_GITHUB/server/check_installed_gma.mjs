import fs from 'fs';

const p = 'C:\\Program Files\\MA Lighting Technologies\\grandma';
if (fs.existsSync(p)) {
  console.log('Installed grandMA2 versions in Program Files:', fs.readdirSync(p));
}

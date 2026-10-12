import AdmZip from 'adm-zip';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const zip = new AdmZip();

// Add root files
zip.addLocalFile(path.join(rootDir, 'package.json'));
if (path.join(rootDir, 'package-lock.json')) {
  try { zip.addLocalFile(path.join(rootDir, 'package-lock.json')); } catch {}
}
zip.addLocalFile(path.join(rootDir, 'Dockerfile'));
zip.addLocalFile(path.join(rootDir, 'render.yaml'));
zip.addLocalFile(path.join(rootDir, '.dockerignore'));
zip.addLocalFile(path.join(rootDir, '.env.example'));

// Add folders
zip.addLocalFolder(path.join(rootDir, 'server'), 'server');
zip.addLocalFolder(path.join(rootDir, 'public'), 'public');

// Output clean package
const outPath = path.join(rootDir, 'RAHUL_LIGHT_ONLINE_24JAM.zip');
zip.writeZip(outPath);
console.log('Successfully created deployment package at:', outPath);

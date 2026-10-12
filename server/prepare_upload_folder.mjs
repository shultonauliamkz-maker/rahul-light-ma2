import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const targetDir = path.join(rootDir, 'UPLOAD_KE_GITHUB');

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

// Copy files
const filesToCopy = [
  'package.json',
  'package-lock.json',
  'render.yaml',
  'Dockerfile',
  '.dockerignore',
  'README.md'
];

for (const f of filesToCopy) {
  const src = path.join(rootDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(targetDir, f));
  }
}

// Copy folders
fs.cpSync(path.join(rootDir, 'server'), path.join(targetDir, 'server'), { recursive: true });
fs.cpSync(path.join(rootDir, 'public'), path.join(targetDir, 'public'), { recursive: true });

console.log('Clean upload folder created successfully at:', targetDir);

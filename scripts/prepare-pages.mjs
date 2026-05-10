import { copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const distDir = resolve('dist');
const indexPath = resolve(distDir, 'index.html');
const fallbackPath = resolve(distDir, '404.html');
const noJekyllPath = resolve(distDir, '.nojekyll');

await copyFile(indexPath, fallbackPath);
await writeFile(noJekyllPath, '', 'utf8');

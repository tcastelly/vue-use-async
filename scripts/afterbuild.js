import path, { join } from 'node:path';
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import recursiveCopy from './_recursiveCopy.js';

//
// script launched after build only

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
  await recursiveCopy('src', 'dist');
  await recursiveCopy('types/src', 'dist');
  await copyFile(join(__dirname, '..', 'types/tests/mockXhr.d.ts'), 'dist/mockXhr.d.ts');
  await copyFile(join(__dirname, '..', 'types/tests/index.d.ts'), 'dist/tests.d.ts');
  console.log('Copy done');
};

main();

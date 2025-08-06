const { join } = require('node:path');
const { copyFile } = require('node:fs/promises');
const recursiveCopy = require('./_recursiveCopy.cjs');

//
// script launched after build only

const main = async () => {
  await recursiveCopy('src', 'dist');
  await recursiveCopy('types/src', 'dist');
  await copyFile(join(__dirname, '..', 'types/tests/mockXhr.d.ts'), 'dist/mockXhr.d.ts');
  await copyFile(join(__dirname, '..', 'types/tests/index.d.ts'), 'dist/tests.d.ts');
  console.log('Copy done');
};

main();

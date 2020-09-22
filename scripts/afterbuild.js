// eslint-disable-next-line @typescript-eslint/no-var-requires
const recursiveCopy = require('./_recursiveCopy');

//
// script launched after build only

const main = async () => {
  await recursiveCopy('src', 'dist');
  await recursiveCopy('types/src', 'dist');
  console.log('Copy done');
};

main();

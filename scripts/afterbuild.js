const recursiveCopy = require('./_recursiveCopy');

//
// script launched after build only

const main = async () => {
  await recursiveCopy('src', 'dist');
  console.log('Copy done');
};

main();

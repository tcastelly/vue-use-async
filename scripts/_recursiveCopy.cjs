const { promisify } = require('util');
const {
  readdir,
  stat,
  copyFile,
} = require('fs');
const { join } = require('path');
const mkdirIfNotExist = require('./_mkdirIfNotExist.cjs');

const copyFileAsync = promisify(copyFile);

const readdirAsync = promisify(readdir);

const statAsync = promisify(stat);

module.exports = async function recursiveCopy(src, dest) {
  const isDirectory = (await statAsync(src)).isDirectory();
  if (isDirectory) {
    await mkdirIfNotExist(dest);

    const childItemNames = await readdirAsync(src);
    return Promise.all(
      childItemNames.map((childItemName) => recursiveCopy(
        join(src, childItemName),
        join(dest, childItemName),
      )),
    );
  }

  if (src.search(/\.js\.flow$/) > -1 || src.search(/\.d\.ts$/) > -1) {
    return copyFileAsync(src, dest);
  }
  return null;
};

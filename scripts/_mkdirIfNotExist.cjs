const { promisify } = require('node:util');
const {
  mkdir,
  access,
  constants,
} = require('node:fs');

const mkdirAsync = promisify(mkdir);

const accessAsync = promisify(access);

module.exports = async function (dest) {
  try {
    await accessAsync(dest, constants.F_OK);
  } catch (e) {
    await mkdirAsync(dest);
  }
};

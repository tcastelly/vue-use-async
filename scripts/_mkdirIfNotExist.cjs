const { promisify } = require('util');
const {
  mkdir,
  access,
  constants,
} = require('fs');

const mkdirAsync = promisify(mkdir);

const accessAsync = promisify(access);

module.exports = async function (dest) {
  try {
    await accessAsync(dest, constants.F_OK);
  } catch (e) {
    await mkdirAsync(dest);
  }
};

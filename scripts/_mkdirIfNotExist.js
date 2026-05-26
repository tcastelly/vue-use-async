import { promisify } from 'node:util';
import { access, constants, mkdir } from 'node:fs';

const mkdirAsync = promisify(mkdir);

const accessAsync = promisify(access);

export default async function (dest) {
  try {
    await accessAsync(dest, constants.F_OK);
  } catch (e) {
    await mkdirAsync(dest);
  }
}

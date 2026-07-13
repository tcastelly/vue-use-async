//
// script launched before build only

import { promises } from 'node:fs';
import { mkdir } from 'node:fs/promises';

const { rm } = promises;

const del = async (dir) => {
  await rm(dir, {
    recursive: true,
    force: true,
  });
  return `${dir} has been deleted!`;
};

const main = async () => {
  const [r, r1] = await Promise.all([
    del('./dist'),
    del('./types'),
  ]);

  await mkdir('./dist');

  console.log(r, r1);
};

main();

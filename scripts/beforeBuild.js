//
// script launched before build only

import { rm } from 'node:fs';
import { mkdir } from 'node:fs/promises';

const del = (dir) => new Promise((resolve, reject) => {
  rm(dir, {
    recursive: true,
    force: true,
  }, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve(`${dir} has been deleted!`);
    }
  });
});

const main = async () => {
  const [r, r1] = await Promise.all([
    del('./dist'),
    del('./types'),
  ]);

  await mkdir('./dist');

  console.log(r, r1);
};

main();

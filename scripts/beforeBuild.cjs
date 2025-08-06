//
// script launched before build only

const fs = require('node:fs');

const del = (dir) => new Promise((resolve) => {
  fs.rm(dir, { recursive: true, force: true }, (err) => {
    if (err) {
      throw err;
    }

    resolve(`${dir} has been deleted!`);
  });
});

const mkdir = (dir) => new Promise((resolve) => {
  fs.mkdir(dir, (err) => {
    if (err) {
      throw err;
    }

    resolve(`${dir} has been created!`);
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

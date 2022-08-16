//
// script launched before build only

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const del = (dir) => new Promise((resolve) => {
  fs.rm(dir, { recursive: true }, (err) => {
    if (err) {
      throw err;
    }

    resolve(`${dir} is deleted!`);
  });
});

const main = async () => {
  const [r, r1] = await Promise.all([
    del('./dist'),
    del('./types'),
  ]);

  console.log(r, r1);
};

main();

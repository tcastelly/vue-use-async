function generateUUID() {
  return '10000000-1000-4000-8000-100000000000'
    // eslint-disable-next-line no-bitwise,@stylistic/no-mixed-operators
    .replace(/[018]/g, (c) => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
}

const uid = generateUUID();

export default uid;

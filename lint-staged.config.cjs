module.exports = {
  '*.{js,jsx}': [
    'eslint --cache --fix',
  ],
  '*.{ts,tsx}': [
    () => 'node_modules/typescript7/bin/tsc -p ./tsconfig.json --skipLibCheck --noEmit',
    'eslint --cache --fix',
  ],
};

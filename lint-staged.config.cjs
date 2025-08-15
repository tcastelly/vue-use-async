module.exports = {
  '*.{js,jsx}': [
    'eslint --cache --fix',
  ],
  '*.{ts,tsx}': [
    () => 'tsc -p ./tsconfig.json --skipLibCheck --noEmit',
    'eslint --cache --fix',
  ],
};

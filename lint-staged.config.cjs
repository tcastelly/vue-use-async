module.exports = {
  '*.{js,jsx}': [
    'eslint --cache --fix',
  ],
  '*.{ts,tsx}': [
    () => 'tsgo -p ./tsconfig.json --skipLibCheck --noEmit',
    'eslint --cache --fix',
  ],
};

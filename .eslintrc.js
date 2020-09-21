module.exports = {
  root: true,
  extends: [
    'airbnb-base',
  ],
  env: {
    es6: true,
    jest: true,
    node: true,
    browser: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    'no-underscore-dangle': 0,
    'no-param-reassign': 0,
    'max-len': [2, 150, 4],
    'max-classes-per-file': 0,
    'space-before-function-paren': 0,

    // controller have to be prototyped
    'class-methods-use-this': 0,

    // report false error because of typescript
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],

    // report false error because of typescript
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],

    // report false error because of typescript
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],

    // because of airbnb
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],
  },
  settings: {
    'import/resolver': {
      typescript: {},
      node: {
        extensions: [
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
        ],
      },
      alias: [
        ['@', './src'],
      ],
    },
  },
};

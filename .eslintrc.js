module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    es6: true,
    jest: true,
    node: true,
    browser: true,
  },
  rules: {
    'no-underscore-dangle': 0,
    'no-param-reassign': 0,
    'max-len': [2, 150, 4],
    'max-classes-per-file': 0,
    'space-before-function-paren': 0,

    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/ban-ts-comment': 0,

    // fix airbnb conflicts
    'import/extensions': 'off',
    'import/no-unresolved': 'off',

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',

    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
  },
  settings: {
    'import/resolver': {
      // Settings for eslint-import-resolver-typescript to resolve TypeScript path mapping.
      typescript: {},
      alias: [
        ['tests', './tests'],
        ['@', './src'],
      ],
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/extensions': ['error', 'ignorePackages', {
      vue: 'never',
      js: 'never',
      mjs: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],
  },
};

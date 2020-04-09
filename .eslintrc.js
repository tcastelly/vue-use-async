'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  'extends': [
    'plugin:flowtype/recommended',
    'airbnb-base'
  ],
  env: {
    es6: true,
    jest: true,
    node: true,
    browser: true,
  },
  parserOptions: {
    ecmaFeatures: {
      // toggle to `false` to use `@decaorator` between `export default` and `class` keywords
      legacyDecorators: false
    }
  },
  plugins: [
    'flowtype',
    'flowtype-errors'
  ],
  rules: {
    'flowtype-errors/show-errors': 2,
    'flowtype-errors/show-warnings': 1,
    'no-underscore-dangle': 0,
    'no-param-reassign': 0,
    'max-len': [2, 150, 4],
    'max-classes-per-file': 0,

    // controller have to be prototyped
    'class-methods-use-this': 0,
  },
  settings: {
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    },
    'import/resolver': {
      alias: [
        ['tests', './tests'],
        ['@', './src'],
      ]
    }
  }
};

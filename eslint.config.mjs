import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import tsParser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';

// mimic CommonJS variables -- not needed if using CommonJS
const __dirname = path.dirname(import.meta.url);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

export default [
  ...compat.config({
    extends: ['airbnb-base'],
  }),
  {
    files: ['**/*.+(ts|tsx|mts|cts|js|mjs|cjs|jsx)'],
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      parser: tsParser,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
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

      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      // fix try/catch unused (e)
      '@typescript-eslint/no-unused-vars': [
        'error', {
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],
      'no-unused-vars': 'off',
    },
    settings: {
      ...importPlugin.configs.typescript.settings,
      'import/resolver': {
        ...importPlugin.configs.typescript.settings['import/resolver'],
      },
    },
  },
  {
    files: ['tests/**'],
    ...jest.configs['flat/recommended'],
    rules: {
      'jest/no-conditional-expect': 'off',
      'import/prefer-default-export': 'off',
    },
  },
  {
    files: ['eslint.config.mjs'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'tests/unit/*.js'],
  },
];

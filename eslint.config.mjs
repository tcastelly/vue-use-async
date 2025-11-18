import path from 'node:path';
import parser from '@typescript-eslint/parser';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { configs, plugins, rules } from 'eslint-config-airbnb-extended';
import pluginNode from 'eslint-plugin-n';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';

const gitignorePath = path.resolve('.', '.gitignore');

const defaultConfig = [
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx,jsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        tsconfigRootDir: path.resolve('.'),
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
  },
];

const jsConfig = [
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,
];

const nodeConfig = [
  {
    // specific rules for node scripts
    files: ['scripts/**/*.cjs'],
    ...pluginNode.configs['flat/recommended'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'import-x/extensions': 'off',
    },
  },
];

const typescriptConfig = [
  plugins.typescriptEslint,
  ...configs.base.typescript,
  rules.typescript.typescriptEslintStrict,

  // custom rules
  {
    files: ['**/*.+(ts|tsx|mts|cts|js|mjs|cjs|jsx)'],
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: null,
          custom: {
            regex: '^(_?[a-zA-Z0-9]*)|([A-Z0-9_])$',
            match: true,
          },
        },
      ],
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@stylistic/max-len': [2, 150, 4],
      'no-underscore-dangle': 'off',
      'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['input'] }],
    },
  },

  // specific rules for custom types
  {
    files: ['**/*.d.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      '@typescript-eslint/no-shadow': 'off',
    },
  },

  // tests overrides
  {
    files: ['tests/**', '**/__mocks__/**/*.js'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      '@stylistic/max-len': [2, 150, 4],
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import-x/extensions': 'off',
      'import-x/no-unresolved': 'off',
      'max-classes-per-file': 'off',
      'no-undef': 'off',
      'no-param-reassign': 'off',
      'no-underscore-dangle': 'off',
    },
  },
  {
    files: ['src/extracted_apis/*.ts'],
    rules: {},
  },
  {
    files: ['eslint.config.mjs'],
    rules: {},
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'tests/unit/*.js'],
  },
];

export default [
  includeIgnoreFile(gitignorePath),
  ...defaultConfig,
  ...jsConfig,
  ...nodeConfig,
  ...typescriptConfig,
];

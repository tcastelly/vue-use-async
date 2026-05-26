import path from 'node:path';
import parser from '@typescript-eslint/parser';
import { includeIgnoreFile } from '@eslint/config-helpers';
import js from '@eslint/js';
import { configs, plugins, rules } from 'eslint-config-airbnb-extended';
import tcyPlugin from '@tcy/eslint-rules/back';
import tcyRecommendedRules from '@tcy/eslint-rules/back/recommended';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';

const gitignorePath = path.resolve('.', '.gitignore');

const defaultConfig = [
  {
    files: ['**/*.{js,cjs,mjs,jsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser,
      parserOptions: {
        tsconfigRootDir: path.resolve('.'),
        ecmaVersion: 'latest',
        sourceType: 'module',
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
  {
    rules: {
      '@stylistic/max-len': [2, 180, 4],
      'import-x/extensions': 'off',
    },
  },
];

const nodeConfig = [
  plugins.node,
  ...configs.node.recommended,
];

const typescriptConfig = [
  plugins.typescriptEslint,
  ...configs.base.typescript,
  rules.typescript.typescriptEslintStrict,
  tcyPlugin,
  // custom rules
  {
    files: ['**/*.+(ts|tsx|mts|cts)'],
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      ...tcyRecommendedRules,
      ...rules.typescript.typescriptEslintStrict.rules,
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'no-param-reassign': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',

      // managed with custom import-specifiers-per-line and /export-specifiers-per-line
      '@stylistic/object-curly-newline': 'off',
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
    plugins: {
      '@typescript-eslint':
      typescriptEslintPlugin,
    },
    languageOptions: {
      parser,
      parserOptions:
        {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
    },
    rules: {
      'import-x/extensions': 'off',
      'class-methods-use-this': 'off',
      'max-classes-per-file': 'off',
      'no-underscore-dangle': 'off',
      'import-x/no-unresolved': 'off',
      'no-undef': 'off',
      '@stylistic/max-len': [2, 160, 4],
      'prefer-promise-reject-errors': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/naming-convention':
        [
          'error',
          {
            selector: 'variable',
            format: null,
            custom: {
              regex: '^[a-zA-Z_][a-zA-Z0-9_]*$',
              match: true,
            },
          },
        ],
    },
  },
  {
    files: ['./scripts/*.js'],
    rules: {
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

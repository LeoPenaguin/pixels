// Strict ESLint: typescript-eslint "strict" and "stylistic" presets with type checking, recommended
// Svelte rules, plus a few consistency rules. Formatting is left to Prettier.
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
import ts from 'typescript-eslint'
import svelteConfig from './svelte.config.js'

export default defineConfig(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: { parserOptions: { parser: ts.parser, svelteConfig } },
  },
  {
    rules: {
      eqeqeq: 'error',
      'no-console': 'error',
      'no-param-reassign': 'error',
      'no-implicit-coercion': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-else-return': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-shadow': 'error',
      'svelte/block-lang': ['error', { script: 'ts' }],
      'svelte/button-has-type': 'error',
      'svelte/require-each-key': 'error',
      'svelte/no-target-blank': 'error',
      'svelte/no-useless-mustaches': 'error',
      'svelte/prefer-class-directive': 'error',
      'svelte/prefer-style-directive': 'error',
      'svelte/shorthand-attribute': 'error',
      'svelte/shorthand-directive': 'error',
      'svelte/spaced-html-comment': 'error',
    },
  },
  {
    // Tests: non-null assertions skip checks that add nothing, and Svelte component exports are
    // typed `any` when seen from a .ts file.
    files: ['**/*.test.ts', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
)

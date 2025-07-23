import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import next from 'eslint-config-next';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  next,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Add your custom rules here if needed
    },
  },
];

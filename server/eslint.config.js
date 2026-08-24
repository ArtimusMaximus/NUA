module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'writable',
        module: 'writable',
        exports: 'writable',
        // Express globals
        req: 'readonly',
        res: 'readonly',
        next: 'readonly',
        // Jest/Mocha testing (if added later)
        describe: 'writable',
        it: 'writable',
        expect: 'writable',
        beforeEach: 'writable',
        afterEach: 'writable',
      },
    },
    rules: {
      // Code quality rules - temporarily warn on unused vars until scheduler refactoring cleans up dead code
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'semi': ['error', 'always'],
      'no-var': 'error',
      // Styling (optional, can be tuned)
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'only-multiline'],
    },
  },
];

import js from '@eslint/js';

export default [
  js.configs.recommended,

  {
    // Apply to all JS source files
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      // Errors
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-duplicate-imports': 'error',

      // Security
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-implied-eval': 'error',
      'no-prototype-builtins': 'error',

      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-return-await': 'warn',   // valid inside try-catch blocks
      'require-await': 'warn',    // async-for-interface-consistency is common in service layers
      'no-throw-literal': 'error',

      // Style (non-formatting — use Prettier for formatting)
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
    },
  },

  {
    // Relax rules in test files
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'require-await': 'off',
    },
  },

  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'build/**',
      'public/**',
      'scripts/**',
      'src/ftp-root/**',
    ],
  },
];

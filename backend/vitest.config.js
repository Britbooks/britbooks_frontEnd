import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      MONGOMS_SYSTEM_BINARY: '/usr/local/bin/mongod',
    },
    sequence: { concurrent: false },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'tests/**', 'scripts/**'],
    },
  },
});

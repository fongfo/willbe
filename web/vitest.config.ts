import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.tsx'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['components/**/*.{ts,tsx}', 'lib/**/*.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname
    }
  }
});

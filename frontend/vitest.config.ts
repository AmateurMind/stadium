import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        lines: 90,
        functions: 65,
        branches: 75,
        statements: 90,
      },
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        '**/*.config.*',
        '**/index.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/store/**',
        'src/hooks/**',
        'src/components/shared/ErrorBoundary.tsx',
        'src/components/shared/SkipLink.tsx',
      ],
    },
  },
});

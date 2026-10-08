/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/signalroom/',
  plugins: [react()],
  test: {
    // Scoped to src/ only: tests/playwright/*.spec.ts are Playwright specs,
    // run via `npx playwright test`, not Vitest's default **/*.spec.ts glob.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})

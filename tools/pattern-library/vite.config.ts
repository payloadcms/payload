import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const VIRTUAL_EMPTY = '\0virtual:empty-scss'

const ignoreScss = {
  enforce: 'pre' as const,
  name: 'ignore-scss',
  load(id: string) {
    if (id === VIRTUAL_EMPTY) {
      return ''
    }
  },
  resolveId(source: string) {
    if (source.endsWith('.scss')) {
      return VIRTUAL_EMPTY
    }
  },
}

// eslint-disable-next-line no-restricted-exports -- Vite config requires default export
export default defineConfig({
  plugins: [react(), ignoreScss],
  resolve: {
    alias: {
      'next/link': path.resolve(__dirname, 'src/mocks/next-link.tsx'),
      'next/link.js': path.resolve(__dirname, 'src/mocks/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, 'src/mocks/next-navigation.ts'),
      'next/navigation.js': path.resolve(__dirname, 'src/mocks/next-navigation.ts'),
      'next/image': path.resolve(__dirname, 'src/mocks/next-image.tsx'),
      'next/image.js': path.resolve(__dirname, 'src/mocks/next-image.tsx'),
      'next/headers': path.resolve(__dirname, 'src/mocks/next-headers.ts'),
      'next/headers.js': path.resolve(__dirname, 'src/mocks/next-headers.ts'),
    },
  },
  server: {
    port: 3333,
    open: false,
  },
})

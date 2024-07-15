import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { commonjs } from '@hyrious/esbuild-plugin-commonjs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const resultServer = esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  splitting: false,
  external: [
    '*.scss',
    '*.css',
    'drizzle-kit',
    'libsql',
    'pg',
    '@payloadcms/translations',
    'payload',
    'payload/*',
  ],
  minify: true,
  metafile: true,
  tsconfig: path.resolve(dirname, './tsconfig.json'),
  plugins: [commonjs()],
  sourcemap: true,
})
console.log('db-postgres bundled successfully')

fs.writeFileSync('meta_server.json', JSON.stringify(resultServer.metafile))

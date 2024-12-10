import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function build() {
  const resultIndex = await esbuild.build({
    entryPoints: ['src/exports/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/exports/index.js',
    splitting: false,
    external: [
      'lodash',
      '*.scss',
      '*.css',
      '@payloadcms/translations',
      'memoizee',
      'pino-pretty',
      'pino',
      //'ajv',
      //'image-size',
    ],
    minify: true,
    metafile: true,
    tsconfig: path.resolve(dirname, './tsconfig.json'),
    // plugins: [commonjs()],
    sourcemap: true,
  })
  console.log('payload server bundled successfully')

  const resultShared = await esbuild.build({
    entryPoints: ['src/exports/shared.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/exports/shared.js',
    splitting: false,
    external: [
      'lodash',
      '*.scss',
      '*.css',
      '@payloadcms/translations',
      'memoizee',
      'pino-pretty',
      'pino',
      //'ajv',
      //'image-size',
    ],
    minify: true,
    metafile: true,
    tsconfig: path.resolve(dirname, './tsconfig.json'),
    // plugins: [commonjs()],
    sourcemap: true,
  })
  console.log('payload shared bundled successfully')

  fs.writeFileSync('meta_index.json', JSON.stringify(resultIndex.metafile))
  fs.writeFileSync('meta_shared.json', JSON.stringify(resultShared.metafile))
}

await build()

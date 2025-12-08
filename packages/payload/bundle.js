import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const directoryArg = process.argv[2] || 'dist'


async function build() {
  const resultIndex = await esbuild.build({
    entryPoints: ['dist/index.js'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: `${directoryArg}/index.js`,
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
    // 18.20.2 is the lowest version of node supported by Payload
    target: 'node18.20.2',
    // plugins: [commonjs()],
    sourcemap: true,
  })
  console.log('payload server bundled successfully')

  const resultShared = await esbuild.build({
    entryPoints: ['dist/exports/shared.js'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: `${directoryArg}/exports/shared.js`,
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
    // 18.20.2 is the lowest version of node supported by Payload
    target: 'node18.20.2',
  })
  console.log('payload shared bundled successfully')

  fs.writeFileSync('meta_index.json', JSON.stringify(resultIndex.metafile))
  fs.writeFileSync('meta_shared.json', JSON.stringify(resultShared.metafile))
}

await build()

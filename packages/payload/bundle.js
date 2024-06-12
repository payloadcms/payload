import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { commonjs } from '@hyrious/esbuild-plugin-commonjs'

const resultServer = await esbuild
  .build({
    entryPoints: ['src/server.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/server.js',
    splitting: false,
    external: [
      '*.scss',
      '*.css',
      '@payloadcms/translations',
      'memoizee',
      'pino-pretty',
      'pino',
      'ajv',
      'conf',
      'image-size',
    ],
    minify: false,
    metafile: true,
    tsconfig: path.resolve(dirname, './tsconfig.json'),
    plugins: [commonjs()],
    sourcemap: true,
  })
  .then((res, err) => {
    console.log('payload server bundled successfully')
    return res
  })
  .catch(() => process.exit(1))

const resultClientAndServer = await esbuild
  .build({
    entryPoints: ['src/bundle.ts'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: 'dist/bundle.js',
    splitting: false,
    external: [
      '*.scss',
      '*.css',
      '@payloadcms/translations',
      'memoizee',
      'pino-pretty',
      'pino',
      'ajv',
      'conf',
      'image-size',
    ],
    minify: false,
    metafile: true,
    tsconfig: path.resolve(dirname, './tsconfig.json'),
    plugins: [commonjs()],
    sourcemap: true,
  })
  .then((res, err) => {
    console.log('payload server bundled successfully')
    return res
  })
  .catch(() => process.exit(1))

fs.writeFileSync('meta_server.json', JSON.stringify(resultServer.metafile))
fs.writeFileSync('meta_bundle.json', JSON.stringify(resultClientAndServer.metafile))

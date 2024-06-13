import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { commonjs } from '@hyrious/esbuild-plugin-commonjs'

const result = await esbuild
  .build({
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

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))

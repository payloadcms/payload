/**
 * This file creates a cjs-compatible bundle of the withPayload function.
 */

import * as esbuild from 'esbuild'
import path from 'path'

await esbuild.build({
  entryPoints: ['dist/withPayload/withPayload.js'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: `dist/cjs/withPayload.cjs`,
  splitting: false,
  minify: true,
  metafile: true,
  tsconfig: path.resolve(import.meta.dirname, 'tsconfig.json'),
  sourcemap: true,
})
console.log('withPayload cjs bundle created successfully')

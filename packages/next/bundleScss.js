import * as esbuild from 'esbuild'
import fs from 'fs'

import { sassPlugin } from 'esbuild-sass-plugin'

// Bundle only the .scss files into a single css file
esbuild.buildSync({
  entryPoints: ['src/esbuildEntry.ts'],
  bundle: true,
  minify: true,
  outdir: 'dist/prod',
  packages: 'external',
  plugins: [sassPlugin({ css: 'external' })],
})

try {
  fs.renameSync('dist/prod/esbuildEntry.css', 'dist/prod/styles.css')
} catch (err) {
  console.error(`Error while renaming index.css: ${err}`)
}

try {
  fs.unlinkSync('dist/esbuildEntry.js')
} catch (err) {
  console.error(`Error while deleting dist/esbuildEntry.js: ${err}`)
}

try {
  fs.unlinkSync('dist/prod/esbuildEntry.js')
} catch (err) {
  console.error(`Error while deleting dist/prod/esbuildEntry.js: ${err}`)
}

try {
  fs.unlinkSync('dist/esbuildEntry.d.ts')
} catch (err) {
  console.error(`Error while deleting dist/esbuildEntry.d.ts: ${err}`)
}

try {
  fs.unlinkSync('dist/esbuildEntry.d.ts.map')
} catch (err) {
  console.error(`Error while deleting dist/esbuildEntry.d.ts.map: ${err}`)
}

try {
  fs.unlinkSync('dist/esbuildEntry.js.map')
} catch (err) {
  console.error(`Error while deleting dist/esbuildEntry.js.map: ${err}`)
}

console.log('styles.css bundled successfully')

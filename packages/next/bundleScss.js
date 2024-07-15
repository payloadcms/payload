import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { sassPlugin } from 'esbuild-sass-plugin'

// Bundle only the .scss files into a single css file
await esbuild
  .build({
    entryPoints: ['src/esbuildEntry.ts'],
    bundle: true,
    minify: true,
    outdir: 'dist/prod',
    packages: 'external',
    plugins: [sassPlugin({ css: 'external' })],
  })
  .then(() => {
    fs.rename('dist/prod/esbuildEntry.css', 'dist/prod/styles.css', (err) => {
      if (err) console.error(`Error while renaming index.css: ${err}`)
    })

    fs.unlink('dist/esbuildEntry.js', (err) => {
      if (err) console.error(`Error while deleting dist/esbuildEntry.js: ${err}`)
    })

    fs.unlink('dist/prod/esbuildEntry.js', (err) => {
      if (err) console.error(`Error while deleting dist/prod/esbuildEntry.js: ${err}`)
    })

    fs.unlink('dist/esbuildEntry.d.ts', (err) => {
      if (err) console.error(`Error while deleting dist/esbuildEntry.d.ts: ${err}`)
    })
    fs.unlink('dist/esbuildEntry.d.ts.map', (err) => {
      if (err) console.error(`Error while deleting dist/esbuildEntry.d.ts.map: ${err}`)
    })
    fs.unlink('dist/esbuildEntry.js.map', (err) => {
      if (err) console.error(`Error while deleting dist/esbuildEntry.js.map: ${err}`)
    })
    console.log('styles.css bundled successfully')
  })
  .catch((e) => {
    throw e
  })

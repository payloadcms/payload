import * as esbuild from 'esbuild'
import fs from 'fs'

import { sassPlugin } from 'esbuild-sass-plugin'

async function build() {
  // Bundle only the .scss files into a single css file
  await esbuild.build({
    entryPoints: ['src/esbuildEntry.ts'],
    bundle: true,
    minify: true,
    outdir: 'dist/prod',
    packages: 'external',
    plugins: [sassPlugin({ css: 'external' })],
  })

  await fs.rename('dist/prod/esbuildEntry.css', 'dist/prod/styles.css', (err) => {
    if (err) {
      console.error(`Error while renaming index.css: ${err}`)
      throw err
    }
  })

  await fs.unlink('dist/esbuildEntry.js', (err) => {
    if (err) {
      console.error(`Error while deleting dist/esbuildEntry.js: ${err}`)
      throw err
    }
  })

  await fs.unlink('dist/prod/esbuildEntry.js', (err) => {
    if (err) {
      console.error(`Error while deleting dist/prod/esbuildEntry.js: ${err}`)
      throw err
    }
  })

  await fs.unlink('dist/esbuildEntry.d.ts', (err) => {
    if (err) {
      console.error(`Error while deleting dist/esbuildEntry.d.ts: ${err}`)
      throw err
    }
  })
  await fs.unlink('dist/esbuildEntry.d.ts.map', (err) => {
    if (err) {
      console.error(`Error while deleting dist/esbuildEntry.d.ts.map: ${err}`)
      throw err
    }
  })
  await fs.unlink('dist/esbuildEntry.js.map', (err) => {
    if (err) {
      console.error(`Error while deleting dist/esbuildEntry.js.map: ${err}`)
      throw err
    }
  })
  console.log('styles.css bundled successfully')
}

await build()

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

  try {
    fs.renameSync('dist/prod/esbuildEntry.css', 'dist/prod/styles.css')
  } catch (err) {
    console.error(`Error while renaming index.css: ${err}`)
    throw err
  }

  console.log('styles.css bundled successfully')

  const filesToDelete = [
    'dist/esbuildEntry.js',
    'dist/prod/esbuildEntry.js',
    'dist/esbuildEntry.d.ts',
    'dist/esbuildEntry.d.ts.map',
    'dist/esbuildEntry.js.map',
  ]

  for (const file of filesToDelete) {
    try {
      fs.unlinkSync(file)
    } catch (err) {
      console.error(`Error while deleting ${file}: ${err}`)
      throw err
    }
  }

  console.log('Files renamed and deleted successfully')
}

await build()

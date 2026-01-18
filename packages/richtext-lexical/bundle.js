import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { sassPlugin } from 'esbuild-sass-plugin'

const directoryArg = process.argv[2] || 'dist'

const shouldSplit = process.argv.includes('--no-split') ? false : true

const removeCSSImports = {
  name: 'remove-css-imports',
  setup(build) {
    build.onLoad({ filter: /.*/ }, async (args) => {
      if (args.path.includes('node_modules') || !args.path.includes(dirname)) return
      const contents = await fs.promises.readFile(args.path, 'utf8')
      const withRemovedImports = contents.replace(/import\s+.*\.scss';?[\r\n\s]*/g, '')
      return { contents: withRemovedImports, loader: 'default' }
    })
  },
}

async function build() {
  //create empty directoryArg/exports/client_optimized dir
  await fs.promises.mkdir(`${directoryArg}/exports/client_optimized`, { recursive: true })

  // Bundle only the .scss files into a single css file
  await esbuild.build({
    entryPoints: ['src/exports/cssEntry.ts'],
    bundle: true,
    minify: true,
    outdir: `${directoryArg}/bundled_scss`,
    loader: { '.svg': 'dataurl' },
    packages: 'external',
    //external: ['*.svg'],
    plugins: [sassPlugin({ css: 'external' })],
  })

  try {
    await fs.promises.rename(`${directoryArg}/bundled_scss/cssEntry.css`, `dist/field/bundled.css`)
    fs.copyFileSync(
      `dist/field/bundled.css`,
      `${directoryArg}/exports/client_optimized/bundled.css`,
    )
    fs.rmSync(`${directoryArg}/bundled_scss`, { recursive: true })
  } catch (err) {
    console.error(`Error while renaming index.css: ${err}`)
    throw err
  }

  console.log(`${directoryArg}/field/bundled.css bundled successfully`)

  // Bundle `client.ts`
  const resultClient = await esbuild.build({
    entryPoints: ['dist/exports/client/index.js'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outdir: `${directoryArg}/exports/client_optimized`,
    //outfile: 'index.js',
    // IMPORTANT: splitting the client bundle means that the `use client` directive will be lost for every chunk
    splitting: shouldSplit,
    external: [
      '*.scss',
      '*.css',
      '*.svg',
      'qs-esm',
      '@dnd-kit/core',
      '@ruya.sa/graphql',
      '@ruya.sa/translations',
      'dequal',

      //'side-channel',
      '@ruya.sa/ui',
      '@ruya.sa/ui/*',
      '@ruya.sa/ui/client',
      '@ruya.sa/ui/shared',
      'lexical',
      'lexical/*',
      '@lexical',
      '@lexical/*',
      '@faceless-ui/*',
      'bson-objectid',
      'payload',
      'payload/*',
      'react',
      'react-dom',
      'next',
      'crypto',
      'lodash',
      'ui',
    ],
    packages: 'external',
    minify: true,
    metafile: true,
    treeShaking: true,

    tsconfig: path.resolve(dirname, './tsconfig.json'),
    plugins: [
      removeCSSImports,
      /*commonjs({
          ignore: ['date-fns', '@floating-ui/react'],
        }),*/
    ],
    sourcemap: true,
  })
  console.log('client/index.ts bundled successfully')

  fs.writeFileSync('meta_client.json', JSON.stringify(resultClient.metafile))
}

await build()

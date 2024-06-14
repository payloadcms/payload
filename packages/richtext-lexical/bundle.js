import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { sassPlugin } from 'esbuild-sass-plugin'

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

// Bundle only the .scss files into a single css file
await esbuild
  .build({
    entryPoints: ['src/exports/client/index.ts'],
    bundle: true,
    minify: true,
    outdir: 'dist/field',
    loader: { '.svg': 'dataurl' },
    packages: 'external',
    //external: ['*.svg'],
    plugins: [sassPlugin({ css: 'external' })],
  })
  .then(() => {
    fs.rename('dist/field/index.css', 'dist/exports/client/bundled.css', (err) => {
      if (err) console.error(`Error while renaming index.css: ${err}`)
    })

    console.log('dist/field/bundled.css bundled successfully')
  })
  .catch(() => process.exit(1))

// Bundle `client.ts`
const resultClient = await esbuild
  .build({
    entryPoints: ['src/exports/client/index.ts'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outdir: 'dist/exports/client',
    //outfile: 'index.js',
    // IMPORTANT: splitting the client bundle means that the `use client` directive will be lost for every chunk
    splitting: true,
    external: [
      '*.scss',
      '*.css',
      '*.svg',
      'qs',
      '@dnd-kit/core',
      '@payloadcms/graphql',
      '@payloadcms/translations',
      'deep-equal',
      'react-toastify',

      //'side-channel',
      '@payloadcms/ui',
      '@payloadcms/ui/*',
      '@payloadcms/ui/client',
      '@payloadcms/ui/shared',
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
      'react-animate-height',
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
  .then((res, err) => {
    console.log('client/index.ts bundled successfully')
    return res
  })
  .catch(() => process.exit(1))

fs.writeFileSync('meta_client.json', JSON.stringify(resultClient.metafile))

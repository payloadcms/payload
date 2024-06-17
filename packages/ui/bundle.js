import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { sassPlugin } from 'esbuild-sass-plugin'
import { commonjs } from '@hyrious/esbuild-plugin-commonjs'

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
    outdir: 'dist',
    packages: 'external',
    plugins: [sassPlugin({ css: 'external' })],
  })
  .then(() => {
    fs.rename('dist/index.css', 'dist/styles.css', (err) => {
      if (err) console.error(`Error while renaming index.css: ${err}`)
    })

    fs.unlink('dist/index.js', (err) => {
      if (err) console.error(`Error while deleting index.js: ${err}`)
    })

    console.log('styles.css bundled successfully')
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
      'qs',
      '@dnd-kit/core',
      '@payloadcms/graphql',
      '@payloadcms/translations',
      'deep-equal',
      'react-toastify',

      //'side-channel',
      'payload',
      'payload/*',
      'react',
      'react-dom',
      'next',
      'react-animate-height',
      'crypto',
    ],
    //packages: 'external',
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
    console.log('client.ts bundled successfully')
    return res
  })
  .catch(() => process.exit(1))

const resultShared = await esbuild
  .build({
    entryPoints: ['src/exports/shared/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: 'dist/exports/shared',
    //outfile: 'index.js',
    // IMPORTANT: splitting the client bundle means that the `use client` directive will be lost for every chunk
    splitting: false,
    treeShaking: true,
    external: [
      '*.scss',
      '*.css',
      'qs',
      '@dnd-kit/core',
      '@payloadcms/graphql',
      '@payloadcms/translations',
      'deep-equal',
      'react-toastify',
      'payload',
      'payload/*',
      'react',
      'react-dom',
      'next',
      'react-animate-height',
      'crypto',
      '@floating-ui/react',
      'date-fns',
      'react-datepicker',
    ],
    //packages: 'external',
    minify: true,
    metafile: true,
    tsconfig: path.resolve(dirname, './tsconfig.json'),
    plugins: [removeCSSImports, commonjs()],
    sourcemap: true,
  })
  .then((res, err) => {
    console.log('shared.ts bundled successfully')
    return res
  })
  .catch(() => process.exit(1))

fs.writeFileSync('meta_client.json', JSON.stringify(resultClient.metafile))
fs.writeFileSync('meta_shared.json', JSON.stringify(resultShared.metafile))

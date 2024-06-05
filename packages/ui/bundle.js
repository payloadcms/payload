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
const result = await esbuild
  .build({
    entryPoints: {
      client: 'src/exports/client/index.ts',
      server: 'src/exports/server/index.ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: 'dist',
    // IMPORTANT: splitting the client bundle means that the `use client` directive will be lost for every chunk
    // splitting: true,
    external: ['*.scss', '*.css'],
    packages: 'external',
    minify: true,
    metafile: true,
    tsconfig: path.resolve(dirname, './tsconfig.json'),
    plugins: [removeCSSImports],
  })
  .then((res, err) => {
    console.log('client.ts and server.ts bundled successfully')
    return res
  })
  .catch(() => process.exit(1))

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))

import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { sassPlugin } from 'esbuild-sass-plugin'

// Bundle only the .scss files into a single css file
esbuild
  .build({
    entryPoints: ['src/exports/main.ts'],
    bundle: true,
    minify: true,
    outdir: 'dist',
    packages: 'external',
    plugins: [sassPlugin({ css: 'external' })],
  })
  .then(() => {
    fs.rename('dist/main.css', 'dist/styles.css', (err) => {
      if (err) console.error(`Error while renaming main.css: ${err}`)
      else console.log('main.css renamed to styles.css')
    })

    fs.unlink('dist/main.js', (err) => {
      if (err) console.error(`Error while deleting main.js: ${err}`)
      else console.log('main.js deleted successfully')
    })
  })
  .catch(() => process.exit(1))

// Bundle server.ts and client.ts without .scss imports
let result = await esbuild
  .build({
    entryPoints: {
      client: 'src/exports/client/index.ts',
      server: 'src/exports/server/index.ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: 'dist',
    splitting: true,
    external: ['*.scss', '*.css'],
    packages: 'external',
    minify: true,
    metafile: true,
    tsconfig: path.resolve(dirname, './tsconfig.json'),
    plugins: [
      {
        name: 'remove-scss-imports',
        setup(build) {
          build.onLoad({ filter: /.*/ }, async (args) => {
            if (args.path.includes('node_modules') || !args.path.includes(dirname)) return
            const contents = await fs.promises.readFile(args.path, 'utf8')
            const newContents = contents.replace(/import\s+.*\.scss';?[\r\n\s]*/g, '')
            return { contents: newContents, loader: 'default' }
          })
        },
      },
    ],
  })
  .catch(() => process.exit(1))

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))

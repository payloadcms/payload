import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let result = await esbuild.build({
  entryPoints: {
    client: 'src/exports/client/index.ts',
    server: 'src/exports/server/index.ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  splitting: true,
  external: ['*.scss', '*.css', 'react', 'react-dom'],
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
  // banner: "'use client'\n\n",
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))

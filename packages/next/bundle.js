import * as esbuild from 'esbuild'
import fs from 'fs'
import { sassPlugin } from 'esbuild-sass-plugin'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const directoryArg = process.argv[2] || 'dist'

async function build() {
  const resultIndex = await esbuild.build({
    entryPoints: ['dist/esbuildEntry.js'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: `${directoryArg}/index.js`,
    splitting: false,
    external: ['@payloadcms/ui', 'payload', '@payloadcms/translations', '@payloadcms/graphql'],
    minify: true,
    metafile: true,
    tsconfig: path.resolve(dirname, './tsconfig.json'),
    // plugins: [commonjs()],
    sourcemap: true,
    plugins: [sassPlugin({ css: 'external' })],
    // 18.20.2 is the lowest version of node supported by Payload
    target: 'node18.20.2',
  })
  console.log('payload server bundled successfully')

  fs.writeFileSync('meta_index.json', JSON.stringify(resultIndex.metafile))
}

await build()

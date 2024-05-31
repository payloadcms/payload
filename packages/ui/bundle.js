import * as esbuild from 'esbuild'
import fs from 'fs'

let plugin = {
  name: 'empty-css-imports',
  setup(build) {
    build.onLoad({ filter: /\.css|scss$/ }, () => ({ contents: '' }))
  },
}

let result = await esbuild.build({
  entryPoints: ['src/exports/client/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  // outfile: 'out.js',
  outdir: 'z',
  splitting: true,
  external: ['*.scss', '*.css', 'react', 'react-dom'],
  minify: true,
  metafile: true,
  plugins: [plugin],
  // banner: "'use client'\n\n",
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))

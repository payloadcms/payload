import * as esbuild from 'esbuild'
import fs from 'fs'
import { swcPlugin } from 'esbuild-plugin-swc'
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
  // outfile: 'out.js',
  outdir: 'dist',
  splitting: true,
  external: ['*.scss', '*.css', 'react', 'react-dom'],
  minify: true,
  metafile: true,
  tsconfig: path.resolve(dirname, './tsconfig.json'),
  plugins: [
    // {
    //   name: 'resolve-ts',
    //   setup(build) {
    //     build.onResolve({ filter: /.*/ }, (args) => {
    //       if (args.kind === 'entry-point') return
    //       let path = args.path
    //       if (!path.endsWith('.js')) path += '.js'
    //       return { path, external: true }
    //     })
    //   },
    // },
    // swcPlugin({
    //   jsc: {
    //     experimental: {
    //       plugins: [
    //         [
    //           'swc-plugin-transform-remove-imports',
    //           {
    //             test: '\\.(scss|css)$',
    //           },
    //         ],
    //       ],
    //     },
    //     parser: {
    //       syntax: 'typescript',
    //       tsx: true,
    //     },
    //   },
    // }),
  ],
  // banner: "'use client'\n\n",
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))

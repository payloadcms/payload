import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { sassPlugin } from 'esbuild-sass-plugin'
import { commonjs } from '@hyrious/esbuild-plugin-commonjs'

const directoryArg = process.argv[2] || 'dist'

const shouldSplit = process.argv.includes('--no-split') ? false : true

const removeCSSImports = {
  name: 'remove-css-imports',
  setup(build) {
    build.onLoad({ filter: /.*/ }, async (args) => {
      if (args.path.includes('node_modules') || !args.path.includes(dirname)) return
      const contents = await fs.promises.readFile(args.path, 'utf8')
      const withRemovedImports = contents.replace(/import\s+.*\.(scss|css)';?[\r\n\s]*/g, '')
      return { contents: withRemovedImports, loader: 'default' }
    })
  },
}

// This plugin ensures there is only one "use client" directive at the top of the file
// and removes any existing directives which are not at the top, for example due to banner inserting
// itself before the directive.
const useClientPlugin = {
  name: 'use-client',
  setup(build) {
    // Temporarily disable file writing
    const originalWrite = build.initialOptions.write
    build.initialOptions.write = false

    build.onEnd((result) => {
      if (result.outputFiles && result.outputFiles.length > 0) {
        const directive = `"use client";`
        const directiveRegex = /"use client";/g

        result.outputFiles.forEach((file) => {
          let contents = file.text

          if (!file.path.endsWith('.map')) {
            contents = contents.replace(directiveRegex, '') // Remove existing use client directives
            contents = directive + '\n' + contents // Prepend our use client directive
          }

          if (originalWrite) {
            const filePath = path.join(build.initialOptions.outdir, path.basename(file.path))

            const dirPath = path.dirname(filePath)
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true })
            }

            // Write the modified contents to file manually instead of using esbuild's write option
            fs.writeFileSync(filePath, contents, 'utf8')
          }
        })
      } else {
        console.error('No output files are available to process in useClientPlugin.')
      }
    })
  },
}

async function build() {
  // Create directoryArg if it doesn't exist
  if (!fs.existsSync(directoryArg)) {
    await fs.promises.mkdir(directoryArg, { recursive: true })
  }

  // Bundle only the .scss files into a single css file
  await esbuild.build({
    entryPoints: ['src/exports/client/index.ts'],
    bundle: true,
    minify: true,
    outdir: 'dist-styles',
    loader: { '.svg': 'dataurl' },
    packages: 'external',
    plugins: [sassPlugin({ css: 'external' })],
  })

  try {
    // Writing esbuild's component styles alone would overwrite the base stylesheet copied by copyfiles.
    // Include the entry's imports and global rules so published styles retain the tokens that prevent controls from collapsing.
    // Read from source because copyfiles does not populate alternative output directories such as esbuild.
    const stylesEntry = fs.readFileSync('src/styles.css', 'utf8')

    const baseCss = stylesEntry.replace(
      /@import\s+['"]\.\/(css\/[^'"]+)['"];?/g,
      (_import, relativePath) => fs.readFileSync(path.join('src', relativePath), 'utf8'),
    )

    const componentCss = fs.readFileSync('dist-styles/index.css', 'utf8')

    fs.writeFileSync(`${directoryArg}/styles.css`, `${baseCss}\n${componentCss}`, 'utf8')
    fs.rmSync('dist-styles', { recursive: true })
  } catch (err) {
    console.error(`Error while bundling styles.css and removing dist-styles: ${err}`)
    throw err
  }

  console.log('styles.css bundled successfully')

  // Bundle `client.ts`. Admin code must import client code from this barrel only:
  // subpaths like `@payloadcms/ui/elements/Link` stay unbundled for apps outside the
  // admin panel, and hold their own copies of providers and contexts.
  const resultClient = await esbuild.build({
    entryPoints: ['dist/exports/client/index.js'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outdir: `${directoryArg}/exports/client_optimized`,
    //outfile: 'index.js',
    // IMPORTANT: splitting the client bundle means that the `use client` directive will be lost for every chunk
    splitting: shouldSplit,
    write: true, // required for useClientPlugin
    banner: {
      js: `// Workaround for react-datepicker and other cjs dependencies potentially inserting require("react") statements
import * as requireReact from 'react';
import * as requireReactDom from 'react-dom';

function require(m) {
 if (m === 'react') return requireReact;
 if (m === 'react-dom') return requireReactDom;
 throw new Error(\`Unknown module \${m}\`);
}
// Workaround end
`, // react-datepicker fails due to require("react") statements making it to the browser, which is not supported.
      // This is a workaround to get it to work, without having to mark react-dateopicker as external
      // See https://stackoverflow.com/questions/68423950/when-using-esbuild-with-external-react-i-get-dynamic-require-of-react-is-not-s
    },
    external: [
      '*.scss',
      '*.css',
      'qs-esm',
      '@dnd-kit/core',
      '@payloadcms/graphql',
      '@payloadcms/translations',
      'dequal',

      //'side-channel',
      'payload',
      'payload/*',
      'react',
      'react-dom',
      'next',
      'crypto',
      // `sonner` owns a module-level toast event bus that the mounted `<Toaster>`
      // subscribes to. Keep it external so code that imports `sonner` directly
      // dispatches to the same bus as the barrel's `<Toaster>`.
      'sonner',
    ],
    //packages: 'external',
    minify: true,
    metafile: true,
    treeShaking: true,

    tsconfig: path.resolve(dirname, './tsconfig.json'),
    plugins: [
      removeCSSImports,
      useClientPlugin, // required for banner to work
      /*commonjs({
          ignore: ['date-fns', '@floating-ui/react'],
        }),*/
    ],
    sourcemap: true,
    // 24.22.1 is the lowest version of node supported by Payload
    target: 'node24.22.1',
  })
  console.log('client.ts bundled successfully')

  const resultShared = await esbuild.build({
    entryPoints: ['dist/exports/shared/index.js'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: `${directoryArg}/exports/shared_optimized`,
    //outfile: 'index.js',
    // IMPORTANT: splitting the client bundle means that the `use client` directive will be lost for every chunk
    splitting: false,
    treeShaking: true,
    external: [
      '*.scss',
      '*.css',
      'qs-esm',
      '@dnd-kit/core',
      '@payloadcms/graphql',
      '@payloadcms/translations',
      'dequal',
      'payload',
      'payload/*',
      'react',
      'react-dom',
      'next',
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
    // 24.22.1 is the lowest version of node supported by Payload
    target: 'node24.22.1',
  })
  console.log('shared.ts bundled successfully')

  fs.writeFileSync('meta_client.json', JSON.stringify(resultClient.metafile))
  fs.writeFileSync('meta_shared.json', JSON.stringify(resultShared.metafile))
}

await build()

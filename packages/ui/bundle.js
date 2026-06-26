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
    packages: 'external',
    plugins: [sassPlugin({ css: 'external' })],
  })

  try {
    // The esbuild pass above bundles only component styles. The design tokens
    // live in `src/css/*.css` (referenced via `src/styles.css`'s `@import`
    // chain). `copyfiles` also copies `src/styles.css` to `dist/styles.css`,
    // but the write below would overwrite it — dropping the tokens entirely.
    // Consumers that load `styles.css` directly (the `@payloadcms/ui/css`
    // export, and `scss/app.scss`'s `@import '../styles.css'`) would then get
    // components with no CSS custom properties, so every `var(--spacer-*)`
    // resolves empty (e.g. switch toggles collapse to 0×0). Prepend the token
    // chain so the published `styles.css` is a complete, self-contained sheet.
    // Read the tokens straight from `src/css/*.css` so this works regardless of
    // `directoryArg` (e.g. `dist` for the normal build, `esbuild` for the
    // bundle-size analysis build, which `copyfiles` does not populate).
    const stylesEntry = fs.readFileSync('src/styles.css', 'utf8')
    const tokenCss = [...stylesEntry.matchAll(/@import\s+['"]\.\/(css\/[^'"]+)['"]/g)]
      .map((match) => fs.readFileSync(path.join('src', match[1]), 'utf8'))
      .join('\n')
    const componentCss = fs.readFileSync('dist-styles/index.css', 'utf8')

    fs.writeFileSync(`${directoryArg}/styles.css`, `${tokenCss}\n${componentCss}`, 'utf8')
    fs.rmSync('dist-styles', { recursive: true })
  } catch (err) {
    console.error(`Error while bundling styles.css and removing dist-styles: ${err}`)
    throw err
  }

  console.log('styles.css bundled successfully')
  // Plugin to externalize all internal relative imports that point outside the
  // exports/ directory. This prevents the barrel from inlining provider/context
  // modules, ensuring that both the barrel export and subpath exports resolve to
  // the same physical files (avoiding duplicate React context instances).
  const externalizeInternalModules = {
    name: 'externalize-internal-modules',
    setup(build) {
      build.onResolve({ filter: /^\.\.\/\.\.\//, namespace: 'file' }, (args) => {
        return { external: true, path: args.path }
      })
    },
  }

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
      // (in the externalized ToastContainer provider) subscribes to. If the barrel
      // inlines its own sonner copy, the `toast` it re-exports dispatches to a
      // different bus than the one `<Toaster>` listens on, so toasts fired from
      // consumer code imported via `@payloadcms/ui` never render. Keep it external
      // so every consumer shares the single node_modules instance.
      'sonner',
    ],
    //packages: 'external',
    minify: true,
    metafile: true,
    treeShaking: true,

    tsconfig: path.resolve(dirname, './tsconfig.json'),
    plugins: [
      externalizeInternalModules,
      removeCSSImports,
      useClientPlugin, // required for banner to work
      /*commonjs({
          ignore: ['date-fns', '@floating-ui/react'],
        }),*/
    ],
    sourcemap: true,
    // 24.15.0 is the lowest version of node supported by Payload
    target: 'node24.15.0',
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
    // 24.15.0 is the lowest version of node supported by Payload
    target: 'node24.15.0',
  })
  console.log('shared.ts bundled successfully')

  fs.writeFileSync('meta_client.json', JSON.stringify(resultClient.metafile))
  fs.writeFileSync('meta_shared.json', JSON.stringify(resultShared.metafile))
}

await build()

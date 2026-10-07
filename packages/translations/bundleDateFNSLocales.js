// A date-fns locale is spread across about seven modules. `importDateFNSLocale` can load 41 of
// them, and bundlers compile every `import()` target, so `next dev` compiled ~290 locale modules in
// each layer (server, SSR and browser) even for an app that only uses English.
//
// This bundles each locale into a single file in `dist/dateFNS/` and points the built
// `importDateFNSLocale` at those files instead of `date-fns/locale/*`. en-US stays a plain date-fns
// import: date-fns' own `format` imports it as its default locale, so apps load it anyway, and a
// bundled copy would load it twice.
//
// Servers don't download anything, so `dist/importDateFNSLocale.server.js` loads every locale
// from one file instead, which compiles much faster than 40. `package.json` maps
// `#importDateFNSLocale` to the per-locale version for browsers and to the server version
// everywhere else.
import * as esbuild from 'esbuild'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { verifyDateFNSLocales } from './verifyDateFNSLocales.js'

const require = createRequire(import.meta.url)
const dateFNSDir = path.dirname(require.resolve('date-fns/package.json'))
const dateFNSExports = require('date-fns/package.json').exports

const packageDir = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(packageDir, 'dist')
const importerFile = path.join(dist, 'importDateFNSLocale.js')
const serverImporterFile = path.join(dist, 'importDateFNSLocale.server.js')
const localeImport = /import\((['"])date-fns\/locale\/((?!en-US\1)[^'"]+)\1\)/g

fs.rmSync(path.join(dist, 'dateFNS'), { force: true, recursive: true })

const code = fs.readFileSync(importerFile, 'utf8')
const locales = [...new Set([...code.matchAll(localeImport)].map((match) => match[2]))]
if (locales.length === 0) {
  throw new Error(`No date-fns locale imports found in ${importerFile}`)
}

// A few locales use date-fns functions, like `isSameWeek`. Those stay imports from date-fns, so
// apps share one copy of them. That copy also holds the options set with `setDefaultOptions`.
const importFunctionsFromDateFNS = {
  name: 'import-functions-from-date-fns',
  setup(build) {
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      const subpath = path
        .relative(dateFNSDir, path.resolve(args.resolveDir, args.path))
        .replaceAll(path.sep, '/')
        .replace(/\.js$/, '')
      if (subpath.startsWith('..') || subpath.startsWith('locale/')) {
        return
      }
      if (!dateFNSExports[`./${subpath}`]) {
        throw new Error(`A date-fns locale imports ${subpath}, which date-fns doesn't export`)
      }
      return { external: true, path: `date-fns/${subpath}` }
    })
  },
}

const { metafile } = await esbuild.build({
  bundle: true,
  // Every locale uses the same helpers from `date-fns/locale/_lib`. Splitting moves them into one
  // shared chunk instead of a copy in each locale.
  chunkNames: 'dateFNS/[name]-[hash]',
  entryPoints: Object.fromEntries(
    locales.map((locale) => [`dateFNS/${locale}`, `date-fns/locale/${locale}`]),
  ),
  format: 'esm',
  metafile: true,
  minify: true,
  outdir: dist,
  platform: 'browser',
  plugins: [importFunctionsFromDateFNS],
  splitting: true,
})

fs.writeFileSync(
  importerFile,
  code.replace(
    localeImport,
    (_match, quote, locale) => `import(${quote}./dateFNS/${locale}.js${quote})`,
  ),
)

const { metafile: serverMetafile } = await esbuild.build({
  bundle: true,
  format: 'esm',
  metafile: true,
  minify: true,
  outfile: path.join(dist, 'dateFNS/all.js'),
  platform: 'neutral',
  plugins: [importFunctionsFromDateFNS],
  stdin: {
    contents: locales.map((locale) => `export * from 'date-fns/locale/${locale}'`).join('\n'),
    resolveDir: packageDir,
  },
})

fs.writeFileSync(
  serverImporterFile,
  code.replace(localeImport, (_match, quote) => `import(${quote}./dateFNS/all.js${quote})`),
)

await verifyDateFNSLocales({ dist, metafiles: [metafile, serverMetafile], serverImporterFile })

console.log(
  `Bundled ${locales.length} date-fns locales into dist/dateFNS, one by one and all together`,
)

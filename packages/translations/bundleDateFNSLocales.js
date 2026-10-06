// A date-fns locale is spread across about seven modules. `importDateFNSLocale` can load 41 of
// them, and bundlers compile every `import()` target, so `next dev` compiled ~290 locale modules in
// each layer (server, SSR and browser) even for an app that only uses English.
//
// This bundles each locale into a single file in `dist/dateFNS/` and points the built
// `importDateFNSLocale` at those files instead of `date-fns/locale/*`. en-US stays a plain date-fns
// import: date-fns' own `format` imports it as its default locale, so apps load it anyway, and a
// bundled copy would load it twice.
import * as esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const importerFile = path.join(dist, 'importDateFNSLocale.js')
const localeImport = /import\((['"])date-fns\/locale\/((?!en-US\1)[^'"]+)\1\)/g

fs.rmSync(path.join(dist, 'dateFNS'), { force: true, recursive: true })

const code = fs.readFileSync(importerFile, 'utf8')
const locales = [...new Set([...code.matchAll(localeImport)].map((match) => match[2]))]
if (locales.length === 0) {
  throw new Error(`No date-fns locale imports found in ${importerFile}`)
}

await esbuild.build({
  bundle: true,
  entryPoints: Object.fromEntries(
    locales.map((locale) => [`dateFNS/${locale}`, `date-fns/locale/${locale}`]),
  ),
  format: 'esm',
  minify: true,
  outdir: dist,
  platform: 'browser',
})

fs.writeFileSync(
  importerFile,
  code.replace(
    localeImport,
    (_match, quote, locale) => `import(${quote}./dateFNS/${locale}.js${quote})`,
  ),
)

console.log(`Bundled ${locales.length} date-fns locales into dist/dateFNS`)

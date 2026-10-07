import fs from 'node:fs'
import path from 'node:path'

/**
 * Checks the locale bundles that `bundleDateFNSLocales.js` wrote, and throws if anything is wrong.
 * It only looks at the output, so it also catches mistakes in how the bundles were built.
 *
 * @param {object} args
 * @param {string} args.dist The translations `dist` folder
 * @param {import('esbuild').Metafile[]} args.metafiles The metafiles of the browser and server
 * builds
 * @param {string} args.serverImporterFile The `importDateFNSLocale` version that loads every
 * locale at once
 */
export const verifyDateFNSLocales = async ({ dist, metafiles, serverImporterFile }) => {
  const filesImportingLocales = fs
    .readdirSync(dist, { recursive: true })
    .filter((file) => file.endsWith('.js'))
    .filter((file) =>
      /date-fns\/locale\/(?!en-US)/.test(fs.readFileSync(path.join(dist, file), 'utf8')),
    )
  if (filesImportingLocales.length > 0) {
    throw new Error(
      `These files still import date-fns locales directly: ${filesImportingLocales.join(', ')}`,
    )
  }

  // Browsers only load the browser build and servers only load the server build, so each build is
  // checked on its own
  for (const metafile of metafiles) {
    const bundledModules = Object.values(metafile.outputs)
      .flatMap((output) => Object.keys(output.inputs))
      .filter((bundledModule) => bundledModule !== '<stdin>')
    const modulesBundledTwice = bundledModules.filter(
      (bundledModule, index) => bundledModules.indexOf(bundledModule) !== index,
    )
    if (modulesBundledTwice.length > 0) {
      throw new Error(
        `These modules are bundled more than once: ${[...new Set(modulesBundledTwice)].join(', ')}`,
      )
    }

    // Apps load en-US and other date-fns functions from date-fns itself, so bundled copies would
    // load twice. The one copy of the `date-fns/locale/_lib` helpers is allowed, since date-fns
    // doesn't export them.
    const modulesAppsAlreadyLoad = bundledModules.filter(
      (bundledModule) =>
        !bundledModule.includes('/date-fns/locale/') ||
        bundledModule.includes('/date-fns/locale/en-US'),
    )
    if (modulesAppsAlreadyLoad.length > 0) {
      throw new Error(
        `These modules should be imported from date-fns, not bundled: ${modulesAppsAlreadyLoad.join(', ')}`,
      )
    }
  }

  const allLocales = await import(path.join(dist, 'dateFNS/all.js'))
  const missingLocales = [
    ...fs
      .readFileSync(serverImporterFile, 'utf8')
      .matchAll(/import\(['"]\.\/dateFNS\/all\.js['"]\)\)\.(\w+)/g),
  ]
    .map((match) => match[1])
    .filter((locale) => !allLocales[locale]?.code)
  if (missingLocales.length > 0) {
    throw new Error(`dateFNS/all.js doesn't export these locales: ${missingLocales.join(', ')}`)
  }
}

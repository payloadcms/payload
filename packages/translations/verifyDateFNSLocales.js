import fs from 'node:fs'
import path from 'node:path'

/**
 * Checks the locale bundles that `bundleDateFNSLocales.js` wrote, and throws if anything is wrong.
 * It only looks at the output, so it also catches mistakes in how the bundles were built.
 *
 * @param {object} args
 * @param {string} args.dist The translations `dist` folder
 * @param {import('esbuild').Metafile} args.metafile The metafile of the build that bundled the locales
 */
export const verifyDateFNSLocales = ({ dist, metafile }) => {
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

  const bundledModules = Object.values(metafile.outputs).flatMap((output) =>
    Object.keys(output.inputs),
  )
  const modulesBundledTwice = bundledModules.filter(
    (bundledModule, index) => bundledModules.indexOf(bundledModule) !== index,
  )
  if (modulesBundledTwice.length > 0) {
    throw new Error(
      `These modules are bundled more than once: ${[...new Set(modulesBundledTwice)].join(', ')}`,
    )
  }

  // Apps load en-US and other date-fns functions from date-fns itself, so bundled copies would load
  // twice. The one copy of the `date-fns/locale/_lib` helpers is allowed, since date-fns doesn't
  // export them.
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

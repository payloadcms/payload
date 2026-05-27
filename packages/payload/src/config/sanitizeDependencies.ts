import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getDependencies } from '../utilities/dependencies/getDependencies.js'
import { PAYLOAD_PACKAGE_LIST } from '../versions/payloadPackageList.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const payloadPkgRoot = path.resolve(dirname, '../../')

const readPayloadFallbackVersion = async (): Promise<string> => {
  try {
    const pkgJsonPath = path.join(payloadPkgRoot, 'package.json')
    const raw = await fs.readFile(pkgJsonPath, 'utf8')
    const parsed = JSON.parse(raw) as { version?: string }
    return parsed.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/**
 * Strip any subpath after the npm package name. For `@payloadcms/next/utilities`,
 * the package name is `@payloadcms/next`. For `lodash/get`, it's `lodash`.
 * The list passed to `getDependencies` includes subpath probes (e.g. to verify
 * a specific export resolves), but for display we only want the bare package.
 */
const stripSubpath = (specifier: string): string => {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/')
    return name ? `${scope}/${name}` : specifier
  }
  return specifier.split('/')[0] ?? specifier
}

/**
 * Scan the user's project for installed Payload-related packages and return
 * an alphabetically-sorted map of name → version. Always contains `payload`.
 * Never throws — falls back to a single-entry map if the scan fails.
 */
export const sanitizeDependencies = async (): Promise<Record<string, string>> => {
  try {
    const result = await getDependencies(process.cwd(), ['payload', ...PAYLOAD_PACKAGE_LIST])
    const map: Record<string, string> = {}
    for (const [specifier, { version }] of result.resolved) {
      const name = stripSubpath(specifier)
      // If the same package is probed via multiple specifiers, keep the first hit.
      if (!map[name]) {
        map[name] = version
      }
    }
    const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)))
    if (!sorted.payload) {
      sorted.payload = await readPayloadFallbackVersion()
    }
    return sorted
  } catch {
    return { payload: await readPayloadFallbackVersion() }
  }
}

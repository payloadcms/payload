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
 * Scan the user's project for installed Payload-related packages and return
 * an alphabetically-sorted map of name → version. Always contains `payload`.
 * Never throws — falls back to a single-entry map if the scan fails.
 */
export const sanitizeDependencies = async (): Promise<Record<string, string>> => {
  try {
    const result = await getDependencies(process.cwd(), ['payload', ...PAYLOAD_PACKAGE_LIST])
    const entries = [...result.resolved.entries()]
      .map(([name, { version }]) => [name, version] as const)
      .sort(([a], [b]) => a.localeCompare(b))
    const map = Object.fromEntries(entries)
    if (!map.payload) {
      map.payload = await readPayloadFallbackVersion()
    }
    return map
  } catch {
    return { payload: await readPayloadFallbackVersion() }
  }
}

import { readFileSync } from 'fs'

import { resolveFrom } from './dependencies/resolveFrom.js'

/**
 * Reads the version of the Next.js installed alongside the running app.
 * Returns undefined if Next.js cannot be resolved, e.g. because Payload runs
 * outside of Next.js or from a directory the app's dependencies are not visible from.
 */
export const getNextVersion = (): string | undefined => {
  try {
    const packageJSONPath = resolveFrom(process.cwd(), 'next/package.json', true)

    if (!packageJSONPath) {
      return undefined
    }

    const { version } = JSON.parse(readFileSync(packageJSONPath, 'utf-8'))

    return typeof version === 'string' ? version : undefined
  } catch (_) {
    return undefined
  }
}

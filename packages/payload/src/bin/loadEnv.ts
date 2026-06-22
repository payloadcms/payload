import * as nextEnvImport from '@next/env'

import { findUpSync } from '../utilities/findUp.js'

// @next/env is CJS-only with no default export. Node 24 strictly follows the
// __esModule flag and returns undefined for default imports of such packages.
// Namespace import + fallback handles both Node 24 and older Node versions.
const loadEnvConfig = nextEnvImport.loadEnvConfig ?? (nextEnvImport as any).default?.loadEnvConfig

/**
 * Try to find user's env files and load it. Uses the same algorithm next.js uses to parse env files, meaning this also supports .env.local, .env.development, .env.production, etc.
 */
export function loadEnv(path?: string) {
  if (path?.length) {
    loadEnvConfig(path, true)
    return
  }

  const dev = process.env.NODE_ENV !== 'production'
  const { loadedEnvFiles } = loadEnvConfig(process.cwd(), dev)

  if (!loadedEnvFiles?.length) {
    // use findUp to find the env file. So, run loadEnvConfig for every directory upwards
    findUpSync({
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      condition: (dir) => {
        const { loadedEnvFiles } = loadEnvConfig(dir, true)
        if (loadedEnvFiles?.length) {
          return true
        }
      },
      dir: process.cwd(),
    })
  }
}

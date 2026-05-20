import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { existsSync } from 'fs'
import nodePath from 'path'

import { findUpSync } from '../utilities/findUp.js'

/**
 * Loads env files in priority order (same as Next.js convention):
 * .env.${NODE_ENV}.local, .env.local (not for test), .env.${NODE_ENV}, .env
 */
function loadEnvFiles(dir: string, isDev: boolean): boolean {
  const nodeEnv = process.env.NODE_ENV || (isDev ? 'development' : 'production')
  const envFiles = [
    `.env.${nodeEnv}.local`,
    ...(nodeEnv !== 'test' ? ['.env.local'] : []),
    `.env.${nodeEnv}`,
    '.env',
  ]

  let loaded = false

  for (const envFile of envFiles) {
    const filePath = nodePath.resolve(dir, envFile)
    if (existsSync(filePath)) {
      const result = dotenv.config({ path: filePath })
      if (result.parsed) {
        dotenvExpand.expand(result)
        loaded = true
      }
    }
  }

  return loaded
}

/**
 * Try to find user's env files and load them.
 * Supports .env, .env.local, .env.development, .env.production, etc.
 * (same file priority as Next.js)
 */
export function loadEnv(path?: string) {
  const isDev = process.env.NODE_ENV !== 'production'

  if (path?.length) {
    loadEnvFiles(path, isDev)
    return
  }

  const loaded = loadEnvFiles(process.cwd(), isDev)

  if (!loaded) {
    findUpSync({
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      condition: (dir) => {
        if (loadEnvFiles(dir, isDev)) {
          return true
        }
      },
      dir: process.cwd(),
    })
  }
}

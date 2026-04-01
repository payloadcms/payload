import dotenvImport from 'dotenv'
import dotenvExpandImport from 'dotenv-expand'
import fs from 'fs'
import path from 'path'

import { findUpSync } from '../utilities/findUp.js'

const dotenvConfig =
  'config' in dotenvImport ? dotenvImport.config : (dotenvImport as any).default.config
const dotenvExpand =
  'expand' in dotenvExpandImport
    ? dotenvExpandImport.expand
    : (dotenvExpandImport as any).default.expand

function getEnvFilenames(dev: boolean): string[] {
  if (dev) {
    return ['.env.development.local', '.env.local', '.env.development', '.env']
  }
  return ['.env.production.local', '.env.local', '.env.production', '.env']
}

function loadEnvFromDir(dir: string, dev: boolean): boolean {
  const filenames = getEnvFilenames(dev)
  let loaded = false

  for (const filename of filenames) {
    const filePath = path.resolve(dir, filename)
    try {
      fs.accessSync(filePath)
    } catch {
      continue
    }
    const env = dotenvConfig({ path: filePath })
    if (env.parsed) {
      dotenvExpand(env)
      loaded = true
    }
  }

  return loaded
}

/**
 * Try to find user's env files and load them. Supports .env, .env.local,
 * .env.development, .env.production (same priority as Next.js).
 */
export function loadEnv(envPath?: string) {
  if (envPath?.length) {
    loadEnvFromDir(envPath, true)
    return
  }

  const dev = process.env.NODE_ENV !== 'production'
  const loaded = loadEnvFromDir(process.cwd(), dev)

  if (!loaded) {
    findUpSync({
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      condition: (dir) => {
        if (loadEnvFromDir(dir, true)) {
          return true
        }
      },
      dir: process.cwd(),
    })
  }
}

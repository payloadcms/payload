import dotenv from 'dotenv'
import findUp from 'find-up'
import fs from 'fs'
import path from 'path'

/**
 * Try to find user's .env and load it
 */
export function loadEnv() {
  const envPath = findUp.sync('.env')

  if (envPath) {
    dotenv.config({ path: envPath })
  } else {
    const cwdPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(cwdPath)) {
      dotenv.config({
        path: cwdPath,
      })
    }
  }
}

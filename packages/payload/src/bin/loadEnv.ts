import dotenv from 'dotenv'
import findUp from 'find-up'
import fs from 'fs'
import path from 'path'

/**
 * Try to find user's env file and load it. Supports both .env and .env.local
 */
const envFiles = ['.env', '.env.local']

export function loadEnv() {
  for (const file of envFiles) {
    const filePath = findUp.sync(file)
    if (filePath) {
      dotenv.config({ path: filePath })
    } else {
      // If the file is not found via findUp, check the current working directory
      const cwdPath = path.resolve(process.cwd(), file)
      if (fs.existsSync(cwdPath)) {
        dotenv.config({ path: cwdPath })
      }
    }
  }
}

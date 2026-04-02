/**
 * Templates should not contain lock files (pnpm-lock.yaml) to ensure that dependencies
 * are always resolved to their latest compatible versions when users install them.
 */

import { existsSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'

const baseDir = join(process.cwd(), 'templates')

/**
 * Blacklist directories where lock files should not be removed
 */
const excludedDirs: string[] = []

const directories = readdirSync(baseDir, { withFileTypes: true })
  .filter((dir) => dir.isDirectory() && !excludedDirs.includes(dir.name))
  .map((dir) => join(baseDir, dir.name, 'pnpm-lock.yaml'))

directories.forEach((file) => {
  if (existsSync(file)) {
    rmSync(file)
    console.log(`Removed: ${file}`)
  }
})

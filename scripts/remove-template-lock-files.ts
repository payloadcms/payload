/**
 * In order for Payload Cloud to detect the package manager used in a template, it looks for lock files in the root of the template directory.
 *
 * Lock files should remain for blank and website templates, but should be removed for all others.
 */

import { existsSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'

const baseDir = join(process.cwd(), 'templates')

// These directories MUST contain a lock file for Payload Cloud to detect the package manager
const excluded = ['website', 'blank']

const directories = readdirSync(baseDir, { withFileTypes: true })
  .filter((dir) => dir.isDirectory() && !excluded.includes(dir.name))
  .map((dir) => join(baseDir, dir.name, 'pnpm-lock.yaml'))

directories.forEach((file) => {
  if (existsSync(file)) {
    rmSync(file)
    console.log(`Removed: ${file}`)
  }
})

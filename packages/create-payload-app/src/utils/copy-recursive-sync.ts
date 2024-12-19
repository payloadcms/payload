import fs from 'fs'
import path from 'path'

/**
 * Recursively copy files from src to dest
 *
 * @internal
 */
export function copyRecursiveSync(src: string, dest: string, ignoreRegex?: string[]): void {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats !== false && stats.isDirectory()
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true })
    fs.readdirSync(src).forEach((childItemName) => {
      if (
        ignoreRegex &&
        ignoreRegex.some((regex) => {
          return new RegExp(regex).test(childItemName)
        })
      ) {
        console.log(`Ignoring ${childItemName} due to regex: ${ignoreRegex}`)
        return
      }
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName), ignoreRegex)
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

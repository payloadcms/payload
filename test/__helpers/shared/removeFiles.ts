import fs from 'fs'

/**
 * Remove all files in a directory recursively, but keep the directory itself
 * if it exists.
 */
export const removeFiles = (dir: string) => {
  if (!fs.existsSync(dir)) {
    return
  }

  fs.readdirSync(dir).forEach((f) => {
    return fs.rmSync(`${dir}/${f}`, { recursive: true })
  })
}

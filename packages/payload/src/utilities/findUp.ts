// @ts-strict-ignore
import fs from 'fs'
import path from 'path'

/**
 * Synchronously walks up parent directories until a condition is met and/or one of the file names within the fileNames array is found.
 */
export function findUpSync({
  condition,
  dir,
  fileNames,
}: {
  condition?: (dir: string) => boolean | Promise<boolean | string> | string
  dir: string
  fileNames?: string[]
}): null | string {
  const { root } = path.parse(dir)

  while (true) {
    if (fileNames?.length) {
      let found = false
      for (const fileName of fileNames) {
        const filePath = path.join(dir, fileName)
        const exists = pathExistsAndIsAccessibleSync(filePath)
        if (exists) {
          if (!condition) {
            return filePath
          }
          found = true
          break
        }
      }
      if (!found) {
        dir = path.dirname(dir) // Move up one directory level.
        continue
      }
    }
    const result = condition(dir)
    if (result === true) {
      return dir
    }
    if (typeof result === 'string' && result?.length) {
      return result
    }
    if (dir === root) {
      return null // Reached the root directory without a match.
    }
    dir = path.dirname(dir) // Move up one directory level.
  }
}

/**
 * Asynchronously walks up parent directories until a condition is met and/or one of the file names within the fileNames array is found.
 */
export async function findUp({
  condition,
  dir,
  fileNames,
}: {
  condition?: (dir: string) => boolean | Promise<boolean | string> | string
  dir: string
  fileNames?: string[]
}): Promise<null | string> {
  const { root } = path.parse(dir)

  while (true) {
    if (fileNames?.length) {
      let found = false
      for (const fileName of fileNames) {
        const filePath = path.resolve(dir, fileName)
        const exists = await pathExistsAndIsAccessible(filePath)
        if (exists) {
          if (!condition) {
            return filePath
          }
          found = true
          break
        }
      }
      if (!found) {
        dir = path.dirname(dir) // Move up one directory level.
        continue
      }
    }
    const result = await condition(dir)
    if (result === true) {
      return dir
    }
    if (typeof result === 'string' && result?.length) {
      return result
    }
    if (dir === root) {
      return null // Reached the root directory without a match.
    }
    dir = path.dirname(dir) // Move up one directory level.
  }
}

// From https://github.com/sindresorhus/path-exists/blob/main/index.js
// fs.accessSync is preferred over fs.existsSync as it's usually a good idea
// to check if the process has permission to read/write to a file before doing so.
// Also see https://github.com/nodejs/node/issues/39960
export function pathExistsAndIsAccessibleSync(path: string) {
  try {
    fs.accessSync(path)
    return true
  } catch {
    return false
  }
}

export async function pathExistsAndIsAccessible(path: string) {
  try {
    await fs.promises.access(path)
    return true
  } catch {
    return false
  }
}

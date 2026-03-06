import fs from 'fs/promises'
import path from 'path'

async function pathOrFileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Returns the path to the import map file. If the import map file is not found, it throws an error.
 */
export async function resolveImportMapFilePath({
  adminRoute = '/admin',
  importMapFile,
  rootDir,
}: {
  adminRoute?: string
  importMapFile?: string
  rootDir: string
}): Promise<Error | string> {
  let importMapFilePath: string | undefined = undefined

  if (importMapFile?.length) {
    if (!(await pathOrFileExists(importMapFile))) {
      try {
        await fs.writeFile(importMapFile, '', { flag: 'wx' })
      } catch (err) {
        return new Error(
          `Could not find the import map file at ${importMapFile}${err instanceof Error && err?.message ? `: ${err.message}` : ''}`,
        )
      }
    }
    importMapFilePath = importMapFile
  } else {
    const appLocation = path.resolve(rootDir, `app/(payload)${adminRoute}/`)
    const srcAppLocation = path.resolve(rootDir, `src/app/(payload)${adminRoute}/`)

    if (appLocation && (await pathOrFileExists(appLocation))) {
      importMapFilePath = path.resolve(appLocation, 'importMap.js')
      if (!(await pathOrFileExists(importMapFilePath))) {
        await fs.writeFile(importMapFilePath, '', { flag: 'wx' })
      }
    } else if (srcAppLocation && (await pathOrFileExists(srcAppLocation))) {
      importMapFilePath = path.resolve(srcAppLocation, 'importMap.js')
      if (!(await pathOrFileExists(importMapFilePath))) {
        await fs.writeFile(importMapFilePath, '', { flag: 'wx' })
      }
    } else {
      return new Error(
        `Could not find Payload import map folder. Looked in ${appLocation} and ${srcAppLocation}`,
      )
    }
  }
  return importMapFilePath
}

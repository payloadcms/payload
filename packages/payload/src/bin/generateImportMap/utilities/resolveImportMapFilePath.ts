import fs from 'fs'
import path from 'path'

/**
 * Returns the path to the import map file. If the import map file is not found, it throws an error.
 */
export function resolveImportMapFilePath({
  adminRoute = '/admin',
  importMapFile,
  rootDir,
}: {
  adminRoute?: string
  importMapFile?: string
  rootDir: string
}) {
  let importMapFilePath: string | undefined = undefined

  if (importMapFile?.length) {
    if (!fs.existsSync(importMapFile)) {
      throw new Error(`Could not find the import map file at ${importMapFile}`)
    }
    importMapFilePath = importMapFile
  } else {
    const appLocation = path.resolve(rootDir, `app/(payload)${adminRoute}/`)
    const srcAppLocation = path.resolve(rootDir, `src/app/(payload)${adminRoute}/`)

    if (fs.existsSync(appLocation)) {
      importMapFilePath = path.resolve(appLocation, 'importMap.js')
    } else if (fs.existsSync(srcAppLocation)) {
      importMapFilePath = path.resolve(srcAppLocation, 'importMap.js')
    } else {
      throw new Error(
        `Could not find Payload import map folder. Looked in ${appLocation} and ${srcAppLocation}`,
      )
    }
  }
  return importMapFilePath
}

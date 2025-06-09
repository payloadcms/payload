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
      try {
        fs.writeFileSync(importMapFile, '', { flag: 'wx' })
      } catch (err) {
        throw new Error(`Could not find the import map file at ${importMapFile}`, err)
      }
    }
    importMapFilePath = importMapFile
  } else {
    const appLocation = path.resolve(rootDir, `app/(payload)${adminRoute}/`)
    const srcAppLocation = path.resolve(rootDir, `src/app/(payload)${adminRoute}/`)

    if (fs.existsSync(appLocation)) {
      const importMapJsPath = path.resolve(appLocation, 'importMap.js')
      if (!fs.existsSync(importMapJsPath)) {
        fs.writeFileSync(importMapJsPath, '', { flag: 'wx' })
      }
      importMapFilePath = importMapJsPath
    } else if (fs.existsSync(srcAppLocation)) {
      const importMapJsPath = path.resolve(srcAppLocation, 'importMap.js')
      if (!fs.existsSync(importMapJsPath)) {
        fs.writeFileSync(importMapJsPath, '', { flag: 'wx' })
      }
      importMapFilePath = importMapJsPath
    } else {
      throw new Error(
        `Could not find Payload import map folder. Looked in ${appLocation} and ${srcAppLocation}`,
      )
    }
  }
  return importMapFilePath
}

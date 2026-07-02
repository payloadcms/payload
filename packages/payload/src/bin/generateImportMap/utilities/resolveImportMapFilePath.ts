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
 * Default directory patterns for import map resolution, covering the supported
 * framework conventions. Directories are probed in order and the first existing
 * one wins; the conventions are mutually exclusive in practice, so a Next.js app
 * never matches the TanStack patterns and vice versa.
 *
 * Adapters with a bespoke layout can still bypass this via `candidateDirectories`.
 */
const defaultCandidateDirectories = (rootDir: string, adminRoute: string): string[] => [
  // Next.js App Router: `(payload)` route group nested under the admin route
  path.resolve(rootDir, `app/(payload)${adminRoute}/`),
  path.resolve(rootDir, `src/app/(payload)${adminRoute}/`),
  // TanStack Start: `_payload` pathless route folder at the app root
  path.resolve(rootDir, `app/_payload/`),
  path.resolve(rootDir, `src/app/_payload/`),
]

/**
 * Returns the path to the import map file. If the import map file is not found, it throws an error.
 *
 * @param candidateDirectories - Optional array of directory paths to search for the import map.
 *   Defaults to Next.js app directory convention. Framework adapters can provide their own.
 */
export async function resolveImportMapFilePath({
  adminRoute = '/admin',
  candidateDirectories,
  importMapFile,
  rootDir,
}: {
  adminRoute?: string
  candidateDirectories?: string[]
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
    const directories = candidateDirectories ?? defaultCandidateDirectories(rootDir, adminRoute)

    for (const dir of directories) {
      if (await pathOrFileExists(dir)) {
        importMapFilePath = path.resolve(dir, 'importMap.js')
        if (!(await pathOrFileExists(importMapFilePath))) {
          await fs.writeFile(importMapFilePath, '', { flag: 'wx' })
        }
        break
      }
    }

    if (!importMapFilePath) {
      return new Error(
        `Could not find Payload import map folder. Looked in ${directories.join(' and ')}`,
      )
    }
  }
  return importMapFilePath
}

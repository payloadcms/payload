import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const load = async (filePath) => {
  const resolvedImportWithoutClientFilesPath = path.resolve(
    dirname,
    '../../packages/payload/dist/utilities/importWithoutClientFiles.js',
  )

  // First check if ../../packages/payload/dist/utilities/importWithoutClientFiles.js exist
  // If it does not, throw a proper error
  if (!fs.existsSync(resolvedImportWithoutClientFilesPath)) {
    throw new Error(
      'Looks like payload has not been built. Please run `pnpm build:core` in the monorepo root',
    )
  }

  const importConfigImport = await import(resolvedImportWithoutClientFilesPath)
  const importConfig = importConfigImport.importConfig

  const result = await importConfig(filePath)

  return result
}

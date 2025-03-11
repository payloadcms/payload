import path from 'path'

/**
 * Returns the path that navigates from the import map file to the base directory.
 * This can then be prepended to relative paths in the import map to get the full, absolute path.
 */
export function getImportMapToBaseDirPath({
  baseDir,
  importMapPath,
}: {
  /**
   * Absolute path to the base directory
   */
  baseDir: string
  /**
   * Absolute path to the import map file
   */
  importMapPath: string
}): string {
  const importMapDir = path.dirname(importMapPath)

  // 1. Direct relative path from `importMapDir` -> `baseDir`
  let relativePath = path.relative(importMapDir, baseDir).replace(/\\/g, '/')

  // 2. If they're the same directory, path.relative will be "", so use "./"
  if (!relativePath) {
    relativePath = './'
  } // Add ./ prefix for subdirectories of the current directory
  else if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
    relativePath = `./${relativePath}`
  }

  // 3. For consistency ensure a trailing slash
  if (!relativePath.endsWith('/')) {
    relativePath += '/'
  }

  return relativePath
}

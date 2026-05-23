import path from 'path'

/**
 * Returns the project root: the parent of the outermost `node_modules` segment in
 * `fromPath`. Returns `null` when the path has no `node_modules` (e.g. running from
 * source inside the Payload monorepo).
 */
export const resolveProjectRoot = (fromPath: string): null | string => {
  const segments = fromPath.split(path.sep)
  const nodeModulesIndex = segments.indexOf('node_modules')

  if (nodeModulesIndex <= 0) {
    return null
  }

  return segments.slice(0, nodeModulesIndex).join(path.sep) || null
}

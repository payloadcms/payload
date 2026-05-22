import path from 'path'

/**
 * Derives the consuming project's root directory from a filesystem path that
 * lives inside that project's `node_modules` tree.
 *
 * `@payloadcms/plugin-mcp` is always installed under the target project's
 * `node_modules` - directly when hoisted (npm/yarn), or via pnpm's `.pnpm`
 * store. Either way the project root is the parent of the *first* (outermost)
 * `node_modules` segment in the path:
 *
 *     /app/node_modules/@payloadcms/plugin-mcp/dist/stdio.js
 *     ^^^^ project root
 *     /app/node_modules/.pnpm/@payloadcms+plugin-mcp@x/node_modules/.../stdio.js
 *     ^^^^ project root
 *
 * Returns `null` when the path has no `node_modules` segment — e.g. when
 * running from source inside the Payload monorepo — so the caller can leave
 * the working directory untouched.
 */
export const resolveProjectRoot = (fromPath: string): null | string => {
  const segments = fromPath.split(path.sep)
  const nodeModulesIndex = segments.indexOf('node_modules')

  if (nodeModulesIndex <= 0) {
    return null
  }

  return segments.slice(0, nodeModulesIndex).join(path.sep) || null
}

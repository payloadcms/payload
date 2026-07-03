import path from 'node:path'

/**
 * Returns the default output path for the generated import map file in a
 * TanStack Start project. Matches the `app/_payload/` convention that Payload's
 * import map auto-discovery probes, so the file is found without a custom
 * `admin.importMap.importMapFile` override.
 */
export function getImportMapOutputPath(rootDir?: string): string {
  return path.resolve(rootDir || process.cwd(), 'app', '_payload', 'importMap.js')
}

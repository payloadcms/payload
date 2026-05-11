import path from 'node:path'

/**
 * Returns the default output path for the generated import map file
 * in a TanStack Start project.
 *
 * TanStack Start projects typically use `src/` as the source root,
 * so the import map is placed there.
 */
export function getImportMapOutputPath(rootDir?: string): string {
  return path.resolve(rootDir || process.cwd(), 'src', 'payload-import-map.ts')
}

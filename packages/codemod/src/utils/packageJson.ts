import { globSync, readFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'

/** Internal record carried by the CLI; transforms only see `{ path, data }`. */
export type LoadedPackageJson = {
  data: Record<string, unknown>
  originalText: string
  path: string
}

const EXCLUDED_DIRS = new Set(['.next', 'build', 'dist', 'node_modules'])

/**
 * Load every package.json under `rootPath`, skipping build/dependency dirs.
 * The CLI owns this filesystem read so transforms stay FS-free.
 */
export function loadPackageJsons(rootPath: string): LoadedPackageJson[] {
  const matches = globSync('**/package.json', {
    cwd: rootPath,
    exclude: (entry) => entry.split(/[\\/]/).some((seg) => EXCLUDED_DIRS.has(seg)),
  })

  return matches
    .filter((rel) => !rel.split(sep).some((seg) => EXCLUDED_DIRS.has(seg)))
    .map((rel) => {
      const path = resolve(rootPath, rel)
      const originalText = readFileSync(path, 'utf8')
      return { data: JSON.parse(originalText), originalText, path }
    })
}

/**
 * Re-serialize package.json data, preserving the original indentation style and
 * trailing newline. Key order is preserved by object insertion order.
 */
export function serializePackageJson(data: unknown, originalText: string): string {
  const json = JSON.stringify(data, null, detectIndent(originalText))
  return originalText.endsWith('\n') ? `${json}\n` : json
}

function detectIndent(text: string): number | string {
  const match = /^\{[\r\n]+([ \t]+)/.exec(text)
  const indent = match?.[1]
  if (!indent) {
    return 2
  }
  return indent.startsWith('\t') ? '\t' : indent.length
}

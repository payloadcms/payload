import path from 'path'

/**
 * Resolves a directory inside `test/` that a suite reads runtime assets from.
 *
 * TanStack Start bundles suite files, so `import.meta.url` no longer points at the source
 * folder. Those runs resolve from `ROOT_DIR`, which the TanStack adapters set to `test/`.
 * Every other run keeps its own directory, because the Next dev server sets `ROOT_DIR` to
 * the monorepo root.
 *
 * @param fallbackDir Directory to use when `ROOT_DIR` cannot be trusted, usually the caller's own `dirname`.
 * @param suitePath Path of the directory relative to `test/`, e.g. `fields` or `lexical/collections/Upload`.
 */
export function getTestSuiteDir({
  fallbackDir,
  suitePath,
}: {
  fallbackDir: string
  suitePath: string
}): string {
  if (process.env.PAYLOAD_FRAMEWORK === 'tanstack-start' && process.env.ROOT_DIR) {
    return path.resolve(process.env.ROOT_DIR, suitePath)
  }

  return fallbackDir
}

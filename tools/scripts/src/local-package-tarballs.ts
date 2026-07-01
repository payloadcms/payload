import * as fs from 'node:fs/promises'

/**
 * Derives a package name from a `pnpm pack` tarball filename, e.g.
 * `payload-4.0.0.tgz` -> `payload` and `payloadcms-db-mongodb-4.0.0.tgz` -> `@payloadcms/db-mongodb`.
 * pnpm names scoped tarballs `<scope>-<name>-<version>.tgz`, so the version is the first
 * hyphen-delimited segment that starts with a digit.
 */
export function tgzToPackageName(tgzFileName: string): string {
  const nameWithoutVersion = tgzFileName.replace(/-\d.*\.tgz$/, '')
  return nameWithoutVersion === 'payload'
    ? 'payload'
    : `@payloadcms/${nameWithoutVersion.replace(/^payloadcms-/, '')}`
}

/**
 * Maps every packed Payload `.tgz` in `dir` to its package name and a local `file:` spec,
 * e.g. `@payloadcms/ui` -> `file:./payloadcms-ui-4.0.0.tgz`. Used to repoint a template's
 * workspace dependencies at locally packed tarballs (the current source) instead of the
 * published versions. The `file:` specs are relative, so `dir` must be the directory that
 * holds both the tarballs and the consuming package.json.
 */
export async function mapTarballsToFileSpecs(dir: string): Promise<Record<string, string>> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return Object.fromEntries(
    entries
      .filter(
        (file) =>
          file.isFile() &&
          file.name.endsWith('.tgz') &&
          (file.name.startsWith('payload-') || file.name.startsWith('payloadcms-')),
      )
      .map((file) => [tgzToPackageName(file.name), `file:./${file.name}`]),
  )
}

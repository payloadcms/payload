import type { Document } from '../../types/index.js'
import type { ManagedFileManifest } from '../fileVersioning/types.js'

/** A server-owned role proves the requested representation has materialized bytes. */
export function canReuseStoredDefault({
  doc,
  filename = doc.filename,
}: {
  doc: Document
  filename?: string
}): boolean {
  const manifest = doc._managedFiles as ManagedFileManifest | undefined
  const variant = Object.entries(doc.variants ?? {}).find(
    ([, value]) => (value as Document)?.filename === filename,
  )

  return Boolean(
    filename &&
      manifest?.some(({ roles }) =>
        roles.some((role) =>
          variant
            ? role.type === 'size' && role.sizeKey === variant[0]
            : filename === doc.filename && role.type === 'default',
        ),
      ),
  )
}

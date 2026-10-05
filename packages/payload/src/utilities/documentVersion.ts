import type { DocumentVersion } from '../types/operations.js'

const documentVersions = new WeakMap<object, DocumentVersion>()

/** Remember selectors on returned objects so parallel root selections cannot change each other. */
export function rememberDocumentVersion<T>({
  data,
  version,
}: {
  data: T
  version: DocumentVersion
}): T {
  const visited = new WeakSet<object>()

  const remember = ({ value }: { value: unknown }): void => {
    if (!value || typeof value !== 'object' || visited.has(value)) {
      return
    }

    visited.add(value)
    documentVersions.set(value, version)

    for (const child of Object.values(value)) {
      remember({ value: child })
    }
  }

  remember({ value: data })
  return data
}

export function getDocumentVersion({
  parent,
  version,
}: {
  parent: unknown
  version?: DocumentVersion
}): DocumentVersion {
  return (
    version ??
    (parent && typeof parent === 'object' ? documentVersions.get(parent) : undefined) ??
    'published'
  )
}

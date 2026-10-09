import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { collectStoredFiles } from '../fileVersioning/storedFiles.js'

/** Server-owned representation descriptors distinguish stored bytes from logical outputs. */
export function canReuseStoredDefault({
  collection,
  doc,
  filename = doc.filename,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: Document
  filename?: string
  req: PayloadRequest
}): boolean {
  const variant = Object.entries(doc.variants ?? {}).find(
    ([, value]) => (value as Document)?.filename === filename,
  )

  return Boolean(
    filename &&
      collectStoredFiles({ collection, doc, req }).some(({ roles }) =>
        roles.some((role) =>
          variant
            ? role.type === 'size' && role.sizeKey === variant[0]
            : filename === doc.filename && role.type === 'default',
        ),
      ),
  )
}

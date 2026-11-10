import type { CollectionConfig } from 'payload'

import { dynamicMediaDir, dynamicMediaSlug } from '../shared.js'

export const sourceReadCalls: string[] = []
/** The `doc.id` each storage handler call gets, so a test can check the document it reads for. */
export const sourceReadDocumentIDs: (number | string | undefined)[] = []

export const DynamicMedia: CollectionConfig = {
  slug: dynamicMediaSlug,
  access: {
    create: () => true,
    delete: () => true,
    // Anyone may read the saved file; only a signed-in user may change it with query parameters.
    read: ({ req }) => (req.fileTransform ? Boolean(req.user) : true),
    update: () => true,
  },
  fields: [{ name: 'alt', type: 'text' }],
  upload: {
    handlers: [
      (_req, { doc, params }) => {
        sourceReadCalls.push(params.filename)
        sourceReadDocumentIDs.push(doc?.id)
      },
    ],
    staticDir: dynamicMediaDir,
  },
}

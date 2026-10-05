import type { CollectionConfig } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { draftMediaSlug } from '../slugs.js'

export const uploadDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../uploads',
)

export const Media: CollectionConfig = {
  slug: draftMediaSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    readVersions: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      hooks: {
        beforeValidate: [
          ({ req, value }) => {
            if (req.context.rejectUpload) {
              throw new Error('Rejected upload replacement')
            }
            return value
          },
        ],
      },
      localized: true,
    },
  ],
  upload: {
    imageSizes: [{ name: 'thumbnail', height: 32, width: 32 }],
    staticDir: uploadDirectory,
  },
  versions: { drafts: { localizeStatus: true } },
}

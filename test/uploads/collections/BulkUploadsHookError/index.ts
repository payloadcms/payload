import type { CollectionConfig } from 'payload'

import path from 'path'
import { APIError } from 'payload'
import { fileURLToPath } from 'url'

import { bulkUploadsHookErrorSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const BulkUploadsHookErrorCollection: CollectionConfig = {
  slug: bulkUploadsHookErrorSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'shouldFail',
      type: 'checkbox',
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.shouldFail) {
          throw new APIError('Simulated hook error in beforeChange', 422, undefined, true)
        }
        return data
      },
    ],
  },
  versions: false,
}

import type { CollectionConfig } from 'payload'

import fs from 'fs/promises'
import path from 'path'
import { APIError } from 'payload'
import { fileURLToPath } from 'url'

import { clientUploadTempFileSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * `disableLocalStorage` plus a `mimeTypes` allow list forces the `'full'` content requirement
 * (see getFileContentRequirement.ts), so a client-uploaded file always gets its own temp file
 * via `getFileFromUploadInstructions`. The `handlers` function stands in for a real storage
 * adapter's fetch handler (e.g. S3/Azure) - it always returns the same fixture image, since
 * these tests exercise Payload's own temp-file lifecycle rather than a real upload round trip.
 */
export const ClientUploadTempFileCollection: CollectionConfig = {
  slug: clientUploadTempFileSlug,
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
  upload: {
    disableLocalStorage: true,
    handlers: [
      async () => {
        const buffer = await fs.readFile(path.resolve(dirname, '../../image.png'))
        return new Response(buffer, {
          headers: { 'Content-Type': 'image/png' },
          status: 200,
        })
      },
    ],
    mimeTypes: ['image/*'],
  },
  versions: false,
}

import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { severalOwnersMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Sharp owns `thumbnail` for images and stores it at upload. `pdfPreviewTransformer` owns
 * `preview` for PDFs and builds it from the original when it is requested.
 */
export const SeveralOwnersMedia: CollectionConfig = {
  slug: severalOwnersMediaSlug,
  fields: [],
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}

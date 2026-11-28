import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { hookVariantMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Sharp owns `thumbnail` and `card` for images. For videos, the `poster` hook owns `thumbnail`,
 * the `blur` hook owns `blurhash`, and the `stage-owner` hook owns `preview`.
 */
export const HookVariantMedia: CollectionConfig = {
  slug: hookVariantMediaSlug,
  fields: [
    { name: 'posterBehaviour', type: 'text' },
    { name: 'blurBehaviour', type: 'text' },
    { name: 'hasStageOwner', type: 'checkbox' },
  ],
  upload: {
    mimeTypes: ['image/*', 'video/*'],
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}

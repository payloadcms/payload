import type { CollectionConfig } from 'payload'

import { mediaSlug } from '../../shared.js'

// Mirrors the base upload columns before original and _managedFiles were added.
export const LegacyMedia: CollectionConfig = {
  slug: mediaSlug,
  fields: [
    { name: 'alt', type: 'text' },
    { name: 'url', type: 'text' },
    { name: 'thumbnailURL', type: 'text' },
    { name: 'filename', type: 'text', index: true, unique: true },
    { name: 'mimeType', type: 'text' },
    { name: 'filesize', type: 'number' },
    { name: 'width', type: 'number' },
    { name: 'height', type: 'number' },
    { name: 'focalX', type: 'number' },
    { name: 'focalY', type: 'number' },
  ],
  versions: true,
}

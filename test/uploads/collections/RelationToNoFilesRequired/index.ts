import type { CollectionConfig } from 'payload'

import { noFilesRequiredSlug, relationToNoFilesRequiredSlug } from '../../shared.js'

export const RelationToNoFilesRequired: CollectionConfig = {
  slug: relationToNoFilesRequiredSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'uploadField',
      type: 'upload',
      relationTo: noFilesRequiredSlug,
    },
  ],
}

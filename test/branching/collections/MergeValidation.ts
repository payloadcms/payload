import type { CollectionConfig, Field } from 'payload'

import { mergeValidationSlug } from '../shared.js'

export const buildMergeValidationFields = (): Field[] => [
  {
    name: 'link',
    type: 'group',
    fields: [
      { name: 'type', type: 'select', options: ['custom', 'reference'] },
      {
        name: 'reference',
        type: 'relationship',
        relationTo: [mergeValidationSlug],
        required: true,
        admin: { condition: (_, siblingData) => siblingData.type === 'reference' },
      },
      {
        name: 'url',
        type: 'text',
        required: true,
        admin: { condition: (_, siblingData) => siblingData.type === 'custom' },
      },
    ],
  },
  {
    name: 'layout',
    type: 'blocks',
    localized: true,
    required: true,
    blocks: [{ slug: 'text', fields: [{ name: 'text', type: 'text', required: true }] }],
  },
]

export const MergeValidation: CollectionConfig = {
  slug: mergeValidationSlug,
  fields: buildMergeValidationFields(),
}

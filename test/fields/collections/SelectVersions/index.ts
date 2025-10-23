import type { CollectionConfig } from 'payload'

import { selectVersionsFieldsSlug } from '../../slugs.js'

const SelectVersionsFields: CollectionConfig = {
  slug: selectVersionsFieldsSlug,
  versions: { drafts: { autosave: true } },
  fields: [
    {
      type: 'select',
      hasMany: true,
      options: ['a', 'b', 'c', 'd'],
      name: 'hasMany',
    },
    {
      type: 'array',
      name: 'array',
      fields: [
        {
          type: 'select',
          hasMany: true,
          options: ['a', 'b', 'c'],
          name: 'hasManyArr',
        },
      ],
    },
    {
      type: 'blocks',
      name: 'blocks',
      blocks: [
        {
          slug: 'block',
          fields: [
            {
              type: 'select',
              hasMany: true,
              options: ['a', 'b', 'c'],
              name: 'hasManyBlocks',
            },
          ],
        },
      ],
    },
  ],
}

export default SelectVersionsFields

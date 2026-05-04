import type { CollectionConfig } from 'payload'

import { blocksFieldsSlug } from '../../slugs.js'

const BlocksFields: CollectionConfig = {
  slug: blocksFieldsSlug,
  fields: [
    {
      name: 'contentBlocks',
      type: 'blocks',
      label: 'Content Blocks',
      blocks: [
        {
          slug: 'hero',
          labels: {
            singular: 'Hero',
            plural: 'Heroes',
          },
          fields: [
            {
              name: 'nestedTextField',
              type: 'text',
              label: 'Nested Text Field',
            },
            {
              name: 'nestedSelect',
              type: 'select',
              label: 'Nested Select',
              options: [
                { label: 'Option 1', value: 'option-1' },
                { label: 'Option 2', value: 'option-2' },
                { label: 'Option 3', value: 'option-3' },
              ],
            },
          ],
        },
        {
          slug: 'gallery',
          labels: {
            singular: 'Gallery',
            plural: 'Galleries',
          },
          fields: [
            {
              name: 'nestedTextField',
              type: 'text',
              label: 'Nested Text Field',
            },
            {
              name: 'nestedSelect',
              type: 'select',
              label: 'Nested Select',
              required: true,
              options: [
                { label: 'Option 1', value: 'option-1' },
                { label: 'Option 2', value: 'option-2' },
                { label: 'Option 3', value: 'option-3' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'contentBlocksMinRows',
      type: 'blocks',
      label: 'Content Blocks',
      minRows: 2,
      blocks: [
        {
          slug: 'content',
          fields: [
            {
              name: 'text',
              type: 'text',
              label: 'Text',
            },
          ],
        },
      ],
    },
  ],
}

export default BlocksFields

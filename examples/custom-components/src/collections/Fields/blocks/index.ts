import type { CollectionConfig } from 'payload'

export const blocksFields: CollectionConfig['fields'] = [
  {
    name: 'blocksFieldServerComponent',
    type: 'blocks',
    admin: {
      components: {
        Field: '@/collections/Fields/blocks/components/server/Field#CustomBlocksFieldServer',
      },
    },
    blocks: [
      {
        slug: 'text',
        fields: [
          {
            name: 'content',
            type: 'textarea',
            label: 'Content',
          },
        ],
        labels: {
          plural: 'Text Blocks',
          singular: 'Text Block',
        },
      },
    ],
  },
  {
    name: 'blocksFieldClientComponent',
    type: 'blocks',
    admin: {
      components: {
        Field: '@/collections/Fields/blocks/components/client/Field#CustomBlocksFieldClient',
      },
    },
    blocks: [
      {
        slug: 'text',
        fields: [
          {
            name: 'content',
            type: 'textarea',
            label: 'Content',
          },
        ],
        labels: {
          plural: 'Text Blocks',
          singular: 'Text Block',
        },
      },
    ],
  },
]

import type { Block } from 'payload'

export const FeatureGridBlock: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  fields: [
    { name: 'sectionTitle', type: 'text', required: true },
    { name: 'sectionDescription', type: 'textarea' },
    {
      name: 'features',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'icon', type: 'text' },
      ],
    },
  ],
}

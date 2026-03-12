import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: 'media',
      fields: [
        {
          name: 'team',
          type: 'relationship',
          relationTo: 'teams',
        },
      ],
    },
    {
      slug: 'teams',
      fields: [
        {
          name: 'organization',
          type: 'relationship',
          relationTo: 'organizations',
        },
      ],
    },
    {
      slug: 'organizations',
      fields: [
        {
          name: 'image',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
  ],
})

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'

export default buildConfigWithDefaults({
  suite: 'database-circular-relation',
  config: {
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
        versions: false,
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
        versions: false,
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
        versions: false,
      },
    ],
  },
})

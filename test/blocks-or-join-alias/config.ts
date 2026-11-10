import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export default buildConfigWithDefaults({
  suite: 'blocks-or-join-alias',
  disableAutoLogin: true,
  config: {
    collections: [
      {
        slug: 'articles',
        admin: {
          listSearchableFields: ['layout.heading', 'layout.caption'],
        },
        fields: [
          {
            name: 'layout',
            type: 'blocks',
            blocks: [
              {
                slug: 'card',
                fields: [
                  {
                    name: 'heading',
                    type: 'text',
                  },
                  {
                    name: 'caption',
                    type: 'text',
                  },
                ],
              },
            ],
          },
        ],
        versions: false,
      },
    ],
  },
})

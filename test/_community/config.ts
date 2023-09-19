import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { MediaCollection } from './collections/Media'
import { PostsCollection, postsSlug } from './collections/Posts'
import { MenuGlobal } from './globals/Menu'

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    // PostsCollection,
    {
      slug: 'posts',
      fields: [
        {
          name: 'myNumberField',
          type: 'number',
          hasMany: true,
        },
      ],
    },
    // MediaCollection,
    // ...add more collections here
  ],
  globals: [
    // MenuGlobal,
    // ...add more globals here
  ],
  graphQL: {
    schemaOutputFile: './test/_community/schema.graphql',
  },

  onInit: async (payload) => {
    const numberField = await payload.create({
      collection: 'posts',
      data: {
        myNumberField: [12, 543, 54],
      },
    })

    console.log(numberField)
  },
})

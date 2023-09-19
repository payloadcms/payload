import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { MediaCollection } from './collections/Media'
import { PostsCollection, postsSlug } from './collections/Posts'
import { MenuGlobal } from './globals/Menu'

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    // PostsCollection,
    // MediaCollection,
    // ...add more collections here
    {
      slug: 'posts',
      fields: [
        {
          name: 'mySelect',
          type: 'select',
          options: ['test', 'test2', 'test3'],
        },
        {
          name: 'mySelectHasMany',
          type: 'select',
          hasMany: true,
          options: ['test', 'test2', 'test3'],
        },
      ],
    },
  ],
  globals: [
    // MenuGlobal,
    // ...add more globals here
  ],
  graphQL: {
    schemaOutputFile: './test/_community/schema.graphql',
  },

  onInit: async (payload) => {
    const test = await payload.create({
      collection: 'posts',
      data: {
        mySelect: 'test3',
        mySelectHasMany: ['test', 'test3'],
      },
    })

    console.log(test)
  },
})

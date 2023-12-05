import FormBuilder from '../../packages/plugin-form-builder/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { MediaCollection } from './collections/Media'
import { PostsCollection, postsSlug } from './collections/Posts'
import { MenuGlobal } from './globals/Menu'

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    PostsCollection,
    MediaCollection,
    // ...add more collections here
  ],
  globals: [
    MenuGlobal,
    // ...add more globals here
  ],
  graphQL: {
    schemaOutputFile: './test/_community/schema.graphql',
  },
  plugins: [FormBuilder({})],

  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const { id: formID } = await payload.create({
      collection: 'forms',
      data: {
        title: 'test',
        confirmationMessage: 'test',
      },
    })

    await payload.create({
      collection: postsSlug,
      data: {
        text: 'example post',
        layout: [
          {
            blockType: 'formBlock',
            form: formID,
          },
        ],
      },
    })
  },
})

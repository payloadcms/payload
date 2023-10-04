import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Pages } from './collections/Pages'
import { Posts, postsSlug } from './collections/Posts'

export const pagesSlug = 'pages'

export default buildConfigWithDefaults({
  admin: {},
  cors: ['http://localhost:3001'],
  csrf: ['http://localhost:3001'],
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'title',
      },
      fields: [],
    },
    Pages,
    Posts,
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const post1 = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Post 1',
        meta: {
          description: 'This is an example of live preview on a post.',
        },
        slug: 'post-1',
        hero: {
          type: 'lowImpact',
          richText: [
            {
              type: 'h1',
              children: [{ text: 'Hello, world!' }],
            },
            {
              type: 'p',
              children: [
                {
                  text: 'This is an example of live preview on a post. You can edit this post in the admin panel and see the changes reflected here.',
                },
              ],
            },
          ],
        },
        layout: [
          {
            blockType: 'block-1',
            title: 'Post 1',
            description: 'This is an example of live preview on a post.',
          },
        ],
      },
    })

    await payload.create({
      collection: pagesSlug,
      data: {
        title: 'Hello, world!',
        meta: {
          description: 'This is an example of live preview on a page.',
        },
        slug: 'home',
        hero: {
          type: 'lowImpact',
          richText: [
            {
              type: 'h1',
              children: [{ text: 'Hello, world!' }],
            },
            {
              type: 'p',
              children: [
                {
                  text: 'This is an example of live preview on a page. You can edit this page in the admin panel and see the changes reflected here.',
                },
              ],
            },
          ],
        },
        layout: [
          {
            blockType: 'block-1',
            title: 'Hello, world!',
            description: 'This is an example of live preview on a page.',
          },
        ],
        featuredPosts: [post1.id],
      },
    })
  },
})

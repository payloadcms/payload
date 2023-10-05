import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import Categories from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts, postsSlug } from './collections/Posts'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'

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
    Categories,
    Media,
  ],
  globals: [Header, Footer],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const media = await payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-1.jpg'),
      data: {
        alt: 'Image 1',
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
          type: 'highImpact',
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
          media: media.id,
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

    const homePage = await payload.create({
      collection: pagesSlug,
      data: {
        slug: 'home',
        title: 'Hello, world!',
        meta: {
          description: 'This is an example of live preview on a page.',
        },
        hero: {
          type: 'highImpact',
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
          media: media.id,
        },
        layout: [
          {
            blockType: 'archive',
            populateBy: 'selection',
            selectedDocs: [
              {
                relationTo: 'posts',
                value: post1.id,
              },
            ],
          },
        ],
      },
    })

    await payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              label: 'Home',
              type: 'reference',
              reference: {
                relationTo: 'pages',
                value: homePage.id,
              },
            },
          },
        ],
      },
    })

    await payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              label: 'Home',
              type: 'reference',
              reference: {
                relationTo: 'pages',
                value: homePage.id,
              },
            },
          },
        ],
      },
    })
  },
})

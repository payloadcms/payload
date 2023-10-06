import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import Categories from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts, postsSlug } from './collections/Posts'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { footer } from './seed/footer'
import { header } from './seed/header'
import { home } from './seed/home'
import { post1 } from './seed/post-1'
import { post2 } from './seed/post-2'
import { post3 } from './seed/post-3'
import { postsPage } from './seed/posts-page'

export const pagesSlug = 'pages'

export default buildConfigWithDefaults({
  admin: {
    livePreview: {
      // You can also define this per collection or per global
      // The Live Preview config is inherited from the top down
      url: ({ data, documentInfo }) =>
        `http://localhost:3001${
          documentInfo.slug !== 'pages' ? `/${documentInfo.slug}` : ''
        }/${data?.slug}`,
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
      ],
      collections: ['pages', 'posts'],
    },
  },
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

    const [post1Doc, post2Doc, post3Doc] = await Promise.all([
      await payload.create({
        collection: postsSlug,
        data: JSON.parse(JSON.stringify(post1).replace(/\{\{IMAGE\}\}/g, media.id)),
      }),
      await payload.create({
        collection: postsSlug,
        data: JSON.parse(JSON.stringify(post2).replace(/\{\{IMAGE\}\}/g, media.id)),
      }),
      await payload.create({
        collection: postsSlug,
        data: JSON.parse(JSON.stringify(post3).replace(/\{\{IMAGE\}\}/g, media.id)),
      }),
    ])

    const postsPageDoc = await payload.create({
      collection: pagesSlug,
      data: JSON.parse(JSON.stringify(postsPage).replace(/\{\{IMAGE\}\}/g, media.id)),
    })

    await payload.create({
      collection: pagesSlug,
      data: JSON.parse(
        JSON.stringify(home)
          .replace(/\{\{MEDIA_ID\}\}/g, media.id)
          .replace(/\{\{POSTS_PAGE_ID\}\}/g, postsPageDoc.id)
          .replace(/\{\{POST_1_ID\}\}/g, post1Doc.id)
          .replace(/\{\{POST_2_ID\}\}/g, post2Doc.id)
          .replace(/\{\{POST_3_ID\}\}/g, post3Doc.id),
      ),
    })

    await payload.updateGlobal({
      slug: 'header',
      data: JSON.parse(JSON.stringify(header).replace(/\{\{POSTS_PAGE_ID\}\}/g, postsPageDoc.id)),
    })

    await payload.updateGlobal({
      slug: 'footer',
      data: JSON.parse(JSON.stringify(footer)),
    })
  },
})

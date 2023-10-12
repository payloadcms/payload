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
          documentInfo?.slug && documentInfo.slug !== 'pages' ? `/${documentInfo.slug}` : ''
        }${data?.slug && data.slug !== 'home' ? `/${data.slug}` : ''}`,
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

    const mediaID = payload.db.defaultIDType === 'number' ? media.id : `"${media.id}"`

    const [post1Doc, post2Doc, post3Doc] = await Promise.all([
      await payload.create({
        collection: postsSlug,
        data: JSON.parse(JSON.stringify(post1).replace(/"\{\{IMAGE\}\}"/g, mediaID)),
      }),
      await payload.create({
        collection: postsSlug,
        data: JSON.parse(JSON.stringify(post2).replace(/"\{\{IMAGE\}\}"/g, mediaID)),
      }),
      await payload.create({
        collection: postsSlug,
        data: JSON.parse(JSON.stringify(post3).replace(/"\{\{IMAGE\}\}"/g, mediaID)),
      }),
    ])

    const postsPageDoc = await payload.create({
      collection: pagesSlug,
      data: JSON.parse(JSON.stringify(postsPage).replace(/"\{\{IMAGE\}\}"/g, mediaID)),
    })

    let postsPageDocID = postsPageDoc.id
    let post1DocID = post1Doc.id
    let post2DocID = post2Doc.id
    let post3DocID = post3Doc.id

    if (payload.db.defaultIDType !== 'number') {
      postsPageDocID = `"${postsPageDoc.id}"`
      post1DocID = `"${post1Doc.id}"`
      post2DocID = `"${post2Doc.id}"`
      post3DocID = `"${post3Doc.id}"`
    }

    await payload.create({
      collection: pagesSlug,
      data: JSON.parse(
        JSON.stringify(home)
          .replace(/"\{\{MEDIA_ID\}\}"/g, mediaID)
          .replace(/"\{\{POSTS_PAGE_ID\}\}"/g, postsPageDocID)
          .replace(/"\{\{POST_1_ID\}\}"/g, post1DocID)
          .replace(/"\{\{POST_2_ID\}\}"/g, post2DocID)
          .replace(/"\{\{POST_3_ID\}\}"/g, post3DocID),
      ),
    })

    await payload.updateGlobal({
      slug: 'header',
      data: JSON.parse(JSON.stringify(header).replace(/"\{\{POSTS_PAGE_ID\}\}"/g, postsPageDocID)),
    })

    await payload.updateGlobal({
      slug: 'footer',
      data: JSON.parse(JSON.stringify(footer)),
    })
  },
})

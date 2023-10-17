import path from 'path'

import type { Config } from '../../../packages/payload/src/config/types'

import { devUser } from '../../credentials'
import { postsSlug } from '../collections/Posts'
import { pagesSlug } from '../config'
import { footer } from './footer'
import { header } from './header'
import { home } from './home'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'
import { postsPage } from './posts-page'

export const seed: Config['onInit'] = async (payload) => {
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
}

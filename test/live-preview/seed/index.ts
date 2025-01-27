import path from 'path'

import type { Config } from '../../../packages/payload/src/config/types'

import { devUser } from '../../credentials'
import removeFiles from '../../helpers/removeFiles'
import { postsSlug } from '../collections/Posts'
import { pagesSlug, tenantsSlug } from '../shared'
import { footer } from './footer'
import { header } from './header'
import { home } from './home'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'
import { postsPage } from './posts-page'
import { tenant1 } from './tenant-1'
import { tenant2 } from './tenant-2'

export const seed: Config['onInit'] = async (payload) => {
  const uploadsDir = path.resolve(__dirname, './media')
  removeFiles(path.normalize(uploadsDir))

  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  const [tenant1Doc] = await Promise.all([
    await payload.create({
      collection: tenantsSlug,
      data: tenant1,
    }),
    await payload.create({
      collection: tenantsSlug,
      data: tenant2,
    }),
  ])

  const media = await payload.create({
    collection: 'media',
    filePath: path.resolve(__dirname, 'image-1.jpg'),
    data: {
      alt: 'Image 1',
    },
  })

  const mediaID = payload.db.defaultIDType === 'number' ? media.id : `"${media.id}"`
  const tenantID = payload.db.defaultIDType === 'number' ? tenant1Doc.id : `"${tenant1Doc.id}"`

  const [post1Doc, post2Doc, post3Doc] = await Promise.all([
    await payload.create({
      collection: postsSlug,
      data: JSON.parse(
        JSON.stringify(post1)
          .replace(/"\{\{IMAGE\}\}"/g, mediaID)
          .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
      ),
    }),
    await payload.create({
      collection: postsSlug,
      data: JSON.parse(
        JSON.stringify(post2)
          .replace(/"\{\{IMAGE\}\}"/g, mediaID)
          .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
      ),
    }),
    await payload.create({
      collection: postsSlug,
      data: JSON.parse(
        JSON.stringify(post3)
          .replace(/"\{\{IMAGE\}\}"/g, mediaID)
          .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
      ),
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
        .replace(/"\{\{POST_3_ID\}\}"/g, post3DocID)
        .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
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

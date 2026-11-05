import type { Config } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { getTestSuiteDir } from '../../__helpers/shared/getTestSuiteDir.js'
import { removeFiles } from '../../__helpers/shared/removeFiles.js'
import { devUser } from '../../credentials.js'
import {
  customLivePreviewSlug,
  pagesSlug,
  postsSlug,
  ssrAutosavePagesSlug,
  ssrPagesSlug,
  tenantsSlug,
} from '../shared.js'
import { footer } from './footer.js'
import { header } from './header.js'
import { home } from './home.js'
import { post1 } from './post-1.js'
import { post2 } from './post-2.js'
import { post3 } from './post-3.js'
import { postsPage } from './posts-page.js'
import { tenant1 } from './tenant-1.js'
import { tenant2 } from './tenant-2.js'
import { trashedPost } from './trashed-post.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const seedDir = getTestSuiteDir({ fallbackDir: dirname, suitePath: 'live-preview/seed' })

export const seed: Config['onInit'] = async (payload) => {
  const existingUser = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: devUser.email,
      },
    },
    overrideAccess: true,
  })

  // Seed already ran => this is likely a consecutive, uncached getPayload call
  if (existingUser.docs.length) {
    return
  }

  const uploadsDir = path.resolve(seedDir, './media')
  removeFiles(path.normalize(uploadsDir))

  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
    overrideAccess: true,
  })

  const tenant1Doc = await payload.create({
    collection: tenantsSlug,
    data: tenant1,
    overrideAccess: true,
  })

  await payload.create({
    collection: tenantsSlug,
    data: tenant2,
    overrideAccess: true,
  })

  const media = await payload.create({
    collection: 'media',
    filePath: path.resolve(seedDir, 'image-1.jpg'),
    data: {
      alt: 'Image 1',
    },
    overrideAccess: true,
  })

  const mediaID = payload.db.defaultIDType === 'number' ? media.id : `"${media.id}"`
  const tenantID = payload.db.defaultIDType === 'number' ? tenant1Doc.id : `"${tenant1Doc.id}"`

  const post1Doc = await payload.create({
    collection: postsSlug,
    data: JSON.parse(
      JSON.stringify(post1)
        .replace(/"\{\{IMAGE\}\}"/g, mediaID)
        .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
    ),
    overrideAccess: true,
  })

  const post2Doc = await payload.create({
    collection: postsSlug,
    data: JSON.parse(
      JSON.stringify(post2)
        .replace(/"\{\{IMAGE\}\}"/g, mediaID)
        .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
    ),
    overrideAccess: true,
  })

  const post3Doc = await payload.create({
    collection: postsSlug,
    data: JSON.parse(
      JSON.stringify(post3)
        .replace(/"\{\{IMAGE\}\}"/g, mediaID)
        .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
    ),
    overrideAccess: true,
  })

  await payload.create({
    collection: postsSlug,
    data: JSON.parse(
      JSON.stringify(trashedPost)
        .replace(/"\{\{IMAGE\}\}"/g, mediaID)
        .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
    ),
    overrideAccess: true,
  })

  const postsPageDoc = await payload.create({
    collection: pagesSlug,
    data: JSON.parse(JSON.stringify(postsPage).replace(/"\{\{IMAGE\}\}"/g, mediaID)),
    overrideAccess: true,
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
    overrideAccess: true,
  })

  await payload.create({
    collection: customLivePreviewSlug,
    data: {
      ...JSON.parse(
        JSON.stringify(home)
          .replace(/"\{\{MEDIA_ID\}\}"/g, mediaID)
          .replace(/"\{\{POSTS_PAGE_ID\}\}"/g, postsPageDocID)
          .replace(/"\{\{POST_1_ID\}\}"/g, post1DocID)
          .replace(/"\{\{POST_2_ID\}\}"/g, post2DocID)
          .replace(/"\{\{POST_3_ID\}\}"/g, post3DocID)
          .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
      ),
      title: 'Custom Live Preview',
      slug: 'custom-live-preview',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: ssrPagesSlug,
    data: {
      ...JSON.parse(
        JSON.stringify(home)
          .replace(/"\{\{MEDIA_ID\}\}"/g, mediaID)
          .replace(/"\{\{POSTS_PAGE_ID\}\}"/g, postsPageDocID)
          .replace(/"\{\{POST_1_ID\}\}"/g, post1DocID)
          .replace(/"\{\{POST_2_ID\}\}"/g, post2DocID)
          .replace(/"\{\{POST_3_ID\}\}"/g, post3DocID)
          .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
      ),
      title: 'SSR Home',
      slug: 'home',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: ssrAutosavePagesSlug,
    data: {
      ...JSON.parse(
        JSON.stringify(home)
          .replace(/"\{\{MEDIA_ID\}\}"/g, mediaID)
          .replace(/"\{\{POSTS_PAGE_ID\}\}"/g, postsPageDocID)
          .replace(/"\{\{POST_1_ID\}\}"/g, post1DocID)
          .replace(/"\{\{POST_2_ID\}\}"/g, post2DocID)
          .replace(/"\{\{POST_3_ID\}\}"/g, post3DocID)
          .replace(/"\{\{TENANT_1_ID\}\}"/g, tenantID),
      ),
      title: 'SSR Home',
      slug: 'home',
    },
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'header',
    data: JSON.parse(
      JSON.stringify(header)
        .replace(/"\{\{POSTS_PAGE_ID\}\}"/g, postsPageDocID)
        .replace(/"\{\{POST_1_ID\}\}"/g, post1DocID)
        .replace(/"\{\{POST_2_ID\}\}"/g, post2DocID)
        .replace(/"\{\{POST_3_ID\}\}"/g, post3DocID),
    ),
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'footer',
    data: JSON.parse(JSON.stringify(footer)),
    overrideAccess: true,
  })
}

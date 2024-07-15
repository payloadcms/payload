import type { Payload, PayloadRequest } from 'payload'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const collections = ['categories', 'media', 'pages', 'posts', 'forms', 'form-submissions']
const globals = ['header', 'footer']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not

  payload.logger.info(`— Clearing media...`)

  const mediaDir = path.resolve(dirname, '../../public/media')
  if (fs.existsSync(mediaDir)) {
    fs.rmdirSync(mediaDir, { recursive: true })
  }

  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all([
    ...collections.map((collection) =>
      payload.delete({
        collection: collection as 'media',
        req,
        where: {},
      }),
    ),
    ...globals.map((global) =>
      payload.updateGlobal({
        slug: global as 'header',
        data: {},
        req,
      }),
    ),
  ])

  payload.logger.info(`— Seeding demo author and user...`)

  await Promise.all(
    ['demo-author@payloadcms.com'].map(async (email) => {
      await payload.delete({
        collection: 'users',
        req,
        where: {
          email: {
            equals: email,
          },
        },
      })
    }),
  )

  const [demoAuthor] = await Promise.all([
    await payload.create({
      collection: 'users',
      data: {
        name: 'Demo Author',
        email: 'demo-author@payloadcms.com',
        password: 'password',
      },
      req,
    }),
  ])

  let demoAuthorID = demoAuthor.id

  payload.logger.info(`— Seeding media...`)

  const [image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    await payload.create({
      collection: 'media',
      data: image1,
      filePath: path.resolve(dirname, 'image-post1.webp'),
      req,
    }),
    await payload.create({
      collection: 'media',
      data: image2,
      filePath: path.resolve(dirname, 'image-post2.webp'),
      req,
    }),
    await payload.create({
      collection: 'media',
      data: image2,
      filePath: path.resolve(dirname, 'image-post3.webp'),
      req,
    }),
    await payload.create({
      collection: 'media',
      data: image2,
      filePath: path.resolve(dirname, 'image-hero1.webp'),
      req,
    }),
  ])

  payload.logger.info(`— Seeding categories...`)

  const [technologyCategory, newsCategory, financeCategory] = await Promise.all([
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Technology',
      },
      req,
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'News',
      },
      req,
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Finance',
      },
      req,
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Design',
      },
      req,
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Software',
      },
      req,
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Engineering',
      },
      req,
    }),
  ])

  let image1ID = image1Doc.id
  let image2ID = image2Doc.id
  let image3ID = image3Doc.id
  let imageHomeID = imageHomeDoc.id

  if (payload.db.defaultIDType === 'text') {
    image1ID = `"${image1Doc.id}"`
    image2ID = `"${image2Doc.id}"`
    image3ID = `"${image3Doc.id}"`
    imageHomeID = `"${imageHomeDoc.id}"`
    demoAuthorID = `"${demoAuthorID}"`
  }

  payload.logger.info(`— Seeding posts...`)

  // Do not create posts with `Promise.all` because we want the posts to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const post1Doc = await payload.create({
    collection: 'posts',
    data: JSON.parse(
      JSON.stringify({ ...post1, categories: [technologyCategory.id] })
        .replace(/"\{\{IMAGE_1\}\}"/g, image1ID)
        .replace(/"\{\{IMAGE_2\}\}"/g, image2ID)
        .replace(/"\{\{AUTHOR\}\}"/g, demoAuthorID),
    ),
    req,
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    data: JSON.parse(
      JSON.stringify({ ...post2, categories: [newsCategory.id] })
        .replace(/"\{\{IMAGE_1\}\}"/g, image2ID)
        .replace(/"\{\{IMAGE_2\}\}"/g, image3ID)
        .replace(/"\{\{AUTHOR\}\}"/g, demoAuthorID),
    ),
    req,
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    data: JSON.parse(
      JSON.stringify({ ...post3, categories: [financeCategory.id] })
        .replace(/"\{\{IMAGE_1\}\}"/g, image3ID)
        .replace(/"\{\{IMAGE_2\}\}"/g, image1ID)
        .replace(/"\{\{AUTHOR\}\}"/g, demoAuthorID),
    ),
    req,
  })

  // update each post with related posts

  await Promise.all([
    await payload.update({
      id: post1Doc.id,
      collection: 'posts',
      data: {
        relatedPosts: [post2Doc.id, post3Doc.id],
      },
      req,
    }),
    await payload.update({
      id: post2Doc.id,
      collection: 'posts',
      data: {
        relatedPosts: [post1Doc.id, post3Doc.id],
      },
      req,
    }),
    await payload.update({
      id: post3Doc.id,
      collection: 'posts',
      data: {
        relatedPosts: [post1Doc.id, post2Doc.id],
      },
      req,
    }),
  ])

  payload.logger.info(`— Seeding home page...`)

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(home)
        .replace(/"\{\{IMAGE_1\}\}"/g, imageHomeID)
        .replace(/"\{\{IMAGE_2\}\}"/g, image2ID),
    ),
    req,
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    data: JSON.parse(JSON.stringify(contactFormData)),
    req,
  })

  let contactFormID = contactForm.id

  if (payload.db.defaultIDType === 'text') {
    contactFormID = `"${contactFormID}"`
  }

  payload.logger.info(`— Seeding contact page...`)

  const contactPage = await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(contactPageData).replace(/"\{\{CONTACT_FORM_ID\}\}"/g, contactFormID),
    ),
    req,
  })

  payload.logger.info(`— Seeding header...`)

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        {
          link: {
            type: 'custom',
            label: 'Posts',
            url: '/posts',
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Contact',
            reference: {
              relationTo: 'pages',
              value: contactPage.id,
            },
          },
        },
      ],
    },
    req,
  })

  payload.logger.info(`— Seeding footer...`)

  await payload.updateGlobal({
    slug: 'footer',
    data: {
      navItems: [
        {
          link: {
            type: 'custom',
            label: 'Admin',
            url: '/admin',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Source Code',
            newTab: true,
            url: 'https://github.com/payloadcms/payload/tree/beta/templates/website',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Payload',
            newTab: true,
            url: 'https://payloadcms.com/',
          },
        },
      ],
    },
    req,
  })

  payload.logger.info('Seeded database successfully!')
}

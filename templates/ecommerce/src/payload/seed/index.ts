import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import { cartPage } from './cart-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { image3 } from './image-3'
import { product1 } from './product-1'
import { product2 } from './product-2'
import { product3 } from './product-3'
import { productsPage } from './products-page'

const collections = ['categories', 'media', 'pages', 'products']
const globals = ['header', 'settings', 'footer']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not

  payload.logger.info(`— Clearing media...`)

  const mediaDir = path.resolve(__dirname, '../../media')
  if (fs.existsSync(mediaDir)) {
    fs.rmdirSync(mediaDir, { recursive: true })
  }

  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all([
    ...collections.map(async collection =>
      payload.delete({
        collection: collection as 'media',
        where: {},
      }),
    ), // eslint-disable-line function-paren-newline
    ...globals.map(async global =>
      payload.updateGlobal({
        slug: global as 'header',
        data: {},
      }),
    ), // eslint-disable-line function-paren-newline
  ])

  payload.logger.info(`— Seeding media...`)

  const [image1Doc, image2Doc, image3Doc] = await Promise.all([
    await payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-1.jpg'),
      data: image1,
    }),
    await payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-2.jpg'),
      data: image2,
    }),
    await payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-3.jpg'),
      data: image3,
    }),
  ])

  let image1ID = image1Doc.id
  let image2ID = image2Doc.id
  let image3ID = image3Doc.id

  if (payload.db.defaultIDType === 'text') {
    image1ID = `"${image1ID}"`
    image2ID = `"${image2ID}"`
    image3ID = `"${image3ID}"`
  }

  payload.logger.info(`— Seeding categories...`)

  const [apparelCategory, ebooksCategory, coursesCategory] = await Promise.all([
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Apparel',
      },
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'E-books',
      },
    }),
    await payload.create({
      collection: 'categories',
      data: {
        title: 'Online courses',
      },
    }),
  ])

  payload.logger.info(`— Seeding products...`)

  // Do not create product with `Promise.all` because we want the products to be created in order
  // This way we can sort them by `createdAt` or `publishedOn` and they will be in the expected order
  const product1Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product1, categories: [apparelCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        image1ID,
      ),
    ),
  })

  const product2Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product2, categories: [ebooksCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        image2ID,
      ),
    ),
  })

  const product3Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product3, categories: [coursesCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        image3ID,
      ),
    ),
  })

  // update each product with related products

  await Promise.all([
    await payload.update({
      collection: 'products',
      id: product1Doc.id,
      data: {
        relatedProducts: [product2Doc.id, product3Doc.id],
      },
    }),
    await payload.update({
      collection: 'products',
      id: product2Doc.id,
      data: {
        relatedProducts: [product1Doc.id, product3Doc.id],
      },
    }),
    await payload.update({
      collection: 'products',
      id: product3Doc.id,
      data: {
        relatedProducts: [product1Doc.id, product2Doc.id],
      },
    }),
  ])

  payload.logger.info(`— Seeding products page...`)

  const productsPageDoc = await payload.create({
    collection: 'pages',
    data: productsPage,
  })

  let productsPageID = productsPageDoc.id

  if (payload.db.defaultIDType === 'text') {
    productsPageID = `"${productsPageID}"`
  }

  payload.logger.info(`— Seeding home page...`)

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(home)
        .replace(/"\{\{PRODUCT1_IMAGE\}\}"/g, image1ID)
        .replace(/"\{\{PRODUCT2_IMAGE\}\}"/g, image2ID)
        .replace(/"\{\{PRODUCTS_PAGE_ID\}\}"/g, productsPageID),
    ),
  })

  payload.logger.info(`— Seeding cart page...`)

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(cartPage).replace(/"\{\{PRODUCTS_PAGE_ID\}\}"/g, productsPageID),
    ),
  })

  payload.logger.info(`— Seeding settings...`)

  await payload.updateGlobal({
    slug: 'settings',
    data: {
      productsPage: productsPageDoc.id,
    },
  })

  payload.logger.info(`— Seeding header...`)

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: productsPageDoc.id,
            },
            label: 'Shop',
          },
        },
      ],
    },
  })

  payload.logger.info('Seeded database successfully!')
}

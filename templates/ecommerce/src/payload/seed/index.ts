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

  // remove the media directory
  const mediaDir = path.resolve(__dirname, '../../media')
  if (fs.existsSync(mediaDir)) {
    fs.rmdirSync(mediaDir, { recursive: true })
  }

  payload.logger.info(`✓ cleared media`)

  // clear the database
  await Promise.all([
    ...collections.map(async collection =>
      payload.delete({
        collection,
        where: {},
      }),
    ), // eslint-disable-line function-paren-newline
    ...globals.map(async global =>
      payload.updateGlobal({
        slug: global,
        data: {},
      }),
    ), // eslint-disable-line function-paren-newline
  ])

  payload.logger.info(`✓ cleared collections and globals`)

  const [image1Doc, image2Doc, image3Doc] = await Promise.all([
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-1.jpg'),
      data: image1,
    }),
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-2.jpg'),
      data: image2,
    }),
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-3.jpg'),
      data: image3,
    }),
  ])

  payload.logger.info(`✓ seeded images`)

  const [apparelCategory, ebooksCategory, coursesCategory] = await Promise.all([
    payload.create({
      collection: 'categories',
      data: {
        title: 'Apparel',
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'E-books',
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Online courses',
      },
    }),
  ])

  payload.logger.info(`✓ seeded categories`)

  Promise.all([
    payload.create({
      collection: 'products',
      data: JSON.parse(
        JSON.stringify({ ...product1, categories: [apparelCategory.id] }).replace(
          /{{PRODUCT_IMAGE}}/g,
          image1Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'products',
      data: JSON.parse(
        JSON.stringify({ ...product2, categories: [ebooksCategory.id] }).replace(
          /{{PRODUCT_IMAGE}}/g,
          image2Doc.id,
        ),
      ),
    }),
    payload.create({
      collection: 'products',
      data: JSON.parse(
        JSON.stringify({ ...product3, categories: [coursesCategory.id] }).replace(
          /{{PRODUCT_IMAGE}}/g,
          image3Doc.id,
        ),
      ),
    }),
  ])

  payload.logger.info(`✓ seeded products`)

  const { id: productsPageID } = await payload.create({
    collection: 'pages',
    data: productsPage,
  })

  payload.logger.info(`✓ seeded products page`)

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(home)
        .replace(/{{PRODUCT1_IMAGE}}/g, image1Doc.id)
        .replace(/{{PRODUCT2_IMAGE}}/g, image2Doc.id)
        .replace(/{{PRODUCTS_PAGE_ID}}/g, productsPageID),
    ),
  })

  payload.logger.info(`✓ seeded home page`)

  await payload.create({
    collection: 'pages',
    data: JSON.parse(JSON.stringify(cartPage).replace(/{{PRODUCTS_PAGE_ID}}/g, productsPageID)),
  })

  payload.logger.info(`✓ seeded cart page`)

  await payload.updateGlobal({
    slug: 'settings',
    data: {
      productsPage: productsPageID,
    },
  })

  payload.logger.info(`✓ seeded settings`)

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: productsPageID,
            },
            label: 'Shop',
          },
        },
      ],
    },
  })

  payload.logger.info(`✓ seeded header`)

  payload.logger.info('Successfully seeded database')
}

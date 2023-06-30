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
import { shopPage } from './shop-page'

const collections = ['categories', 'media', 'pages', 'products', 'orders']
const globals = ['header', 'settings', 'footer']

export const seed = async (payload: Payload): Promise<void> => {
  // remove the media directory
  const mediaDir = path.resolve(__dirname, '../../media')
  if (fs.existsSync(mediaDir)) {
    fs.rmdirSync(mediaDir, { recursive: true })
  }

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

  const { id: shopPageID } = await payload.create({
    collection: 'pages',
    data: shopPage,
  })

  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(home)
        .replace(/{{PRODUCT1_IMAGE}}/g, image1Doc.id)
        .replace(/{{PRODUCT2_IMAGE}}/g, image2Doc.id)
        .replace(/{{SHOP_PAGE_ID}}/g, shopPageID),
    ),
  })

  await payload.create({
    collection: 'pages',
    data: JSON.parse(JSON.stringify(cartPage).replace(/{{SHOP_PAGE_ID}}/g, shopPageID)),
  })

  await payload.updateGlobal({
    slug: 'settings',
    data: {
      shopPage: shopPageID,
    },
  })

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: shopPageID,
            },
            label: 'Shop',
          },
        },
      ],
    },
  })
}

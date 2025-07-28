import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { productMousepad as productMousepadData } from './product-mousepad'
import { productHat as productHatData, variantHat as variantHatData } from './product-hat'
import {
  productHoodie as productHoodieData,
  variantHoodie as variantHoodieData,
} from './product-hoodie'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { Address, Transaction, VariantOption } from '@/payload-types'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'products',
  'forms',
  'form-submissions',
  'search',
  'variantOptions',
  'variantTypes',
  'variants',
  'carts',
  'transactions',
  'addresses',
  'orders',
]

const sizeVariantOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'X Large', value: 'xlarge' },
]

const colorVariantOptions = [
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
]

const globals: GlobalSlug[] = ['header', 'footer']

const baseAddressUSData: Transaction['billingAddress'] = {
  title: 'Dr',
  firstName: 'Otto',
  lastName: 'Octavius',
  phone: '1234567890',
  company: 'Oscorp',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
}

const baseAddressUKData: Transaction['billingAddress'] = {
  title: 'Mr',
  firstName: 'Oliver',
  lastName: 'Twist',
  phone: '1234567890',
  addressLine1: '48 Great Portland St',
  city: 'London',
  postalCode: 'W1W 7ND',
  country: 'GB',
}

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
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info(`— Seeding customer and customer data...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'customer@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  const [
    customer,
    image1Doc,
    image2Doc,
    image3Doc,
    imageHomeDoc,
    accessoriesCategory,
    tshirtsCategory,
    hatsCategory,
    hoodiesCategory,
  ] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Customer',
        email: 'customer@example.com',
        password: 'password',
        roles: ['customer'],
      },
    }),
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Accessories',
        slug: 'accessories',
        breadcrumbs: [
          {
            label: 'Accessories',
            url: '/accessories',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'T-Shirts',
        slug: 'tshirts',
        breadcrumbs: [
          {
            label: 'T-Shirts',
            url: '/tshirts',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Hats',
        slug: 'hats',
        breadcrumbs: [
          {
            label: 'Hats',
            url: '/hats',
          },
        ],
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Hoodies',
        slug: 'hoodies',
        breadcrumbs: [
          {
            label: 'Hoodies',
            url: '/hoodies',
          },
        ],
      },
    }),
  ])

  let customerID: number | string = customer.id

  let image1ID: number | string = image1Doc.id
  let image2ID: number | string = image2Doc.id
  let image3ID: number | string = image3Doc.id
  let imageHomeID: number | string = imageHomeDoc.id

  let accessoriesID: number | string = accessoriesCategory.id
  let tshirtsID: number | string = tshirtsCategory.id
  let hatsID: number | string = hatsCategory.id
  let hoodiesID: number | string = hoodiesCategory.id

  if (payload.db.defaultIDType === 'text') {
    image1ID = `"${image1Doc.id}"`
    image2ID = `"${image2Doc.id}"`
    image3ID = `"${image3Doc.id}"`
    imageHomeID = `"${imageHomeDoc.id}"`
    customerID = `"${customerID}"`

    accessoriesID = `"${accessoriesCategory.id}"`
    tshirtsID = `"${tshirtsCategory.id}"`
    hatsID = `"${hatsCategory.id}"`
    hoodiesID = `"${hoodiesCategory.id}"`
  }

  payload.logger.info(`— Seeding variant types and options...`)

  const sizeVariantType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'size',
      label: 'Size',
    },
  })

  const sizeVariantOptionsResults: VariantOption[] = []

  for (const option of sizeVariantOptions) {
    const result = await payload.create({
      collection: 'variantOptions',
      data: {
        ...option,
        variantType: sizeVariantType.id,
      },
    })
    sizeVariantOptionsResults.push(result)
  }

  const [small, medium, large, xlarge] = sizeVariantOptionsResults

  const colorVariantType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'color',
      label: 'Color',
    },
  })

  const [black, white] = await Promise.all(
    colorVariantOptions.map((option) => {
      return payload.create({
        collection: 'variantOptions',
        data: {
          ...option,
          variantType: colorVariantType.id,
        },
      })
    }),
  )

  let sizeVariantTypeID: number | string = sizeVariantType.id
  let colorVariantTypeID: number | string = colorVariantType.id

  let smallVariantOptionID: number | string = small.id
  let mediumVariantOptionID: number | string = medium.id
  let largeVariantOptionID: number | string = large.id
  let xlargeVariantOptionID: number | string = xlarge.id

  let blackVariantOptionID: number | string = black.id
  let whiteVariantOptionID: number | string = white.id

  if (payload.db.defaultIDType === 'text') {
    sizeVariantTypeID = `"${sizeVariantType.id}"`
    colorVariantTypeID = `"${colorVariantType.id}"`

    smallVariantOptionID = `"${small.id}"`
    mediumVariantOptionID = `"${medium.id}"`
    largeVariantOptionID = `"${large.id}"`
    xlargeVariantOptionID = `"${xlarge.id}"`

    blackVariantOptionID = `"${black.id}"`
    whiteVariantOptionID = `"${white.id}"`
  }

  payload.logger.info(`— Seeding products...`)

  const productMousepad = await payload.create({
    collection: 'products',
    depth: 0,
    data: JSON.parse(
      JSON.stringify(productMousepadData)
        .replace(/"\{\{IMAGE_1\}\}"/g, String(image1ID))
        .replace(/"\{\{IMAGE_2\}\}"/g, String(image2ID))
        .replace(/"\{\{IMAGE_3\}\}"/g, String(image3ID))
        .replace(/"\{\{CATEGORY_1\}\}"/g, String(accessoriesID)),
    ),
  })

  let mousePadID: number | string = productMousepad.id

  if (payload.db.defaultIDType === 'text') {
    mousePadID = `"${mousePadID}"`
  }

  const productHat = await payload.create({
    collection: 'products',
    depth: 0,
    data: JSON.parse(
      JSON.stringify(productHatData)
        .replace(/"\{\{IMAGE_1\}\}"/g, String(image1ID))
        .replace(/"\{\{IMAGE_2\}\}"/g, String(image2ID))
        .replace(/"\{\{IMAGE_3\}\}"/g, String(image3ID))
        .replace(/"\{\{CATEGORY_1\}\}"/g, String(hatsID))
        .replace(/"\{\{VARIANT_TYPE_COLOR\}\}"/g, String(colorVariantTypeID))
        .replace(/"\{\{RELATED_PRODUCT_1\}\}"/g, String(mousePadID)),
    ),
  })

  let hatID: number | string = productHat.id

  if (payload.db.defaultIDType === 'text') {
    hatID = `"${hatID}"`
  }

  const variantHatWhite = await payload.create({
    collection: 'variants',
    depth: 0,
    data: JSON.parse(
      JSON.stringify(variantHatData)
        .replace(/"\{\{VARIANT_OPTION\}\}"/g, String(whiteVariantOptionID))
        .replace(/"\{\{PRODUCT\}\}"/g, String(hatID)),
    ),
  })

  const variantHatBlack = await payload.create({
    collection: 'variants',
    depth: 0,
    data: JSON.parse(
      JSON.stringify(variantHatData)
        .replace(/"\{\{VARIANT_OPTION\}\}"/g, String(blackVariantOptionID))
        .replace(/"\{\{PRODUCT\}\}"/g, String(hatID)),
    ),
  })

  const productHoodie = await payload.create({
    collection: 'products',
    depth: 0,
    data: JSON.parse(
      JSON.stringify(productHoodieData)
        .replace(/"\{\{IMAGE_1\}\}"/g, String(image1ID))
        .replace(/"\{\{IMAGE_2\}\}"/g, String(image2ID))
        .replace(/"\{\{IMAGE_3\}\}"/g, String(image3ID))
        .replace(/"\{\{CATEGORY_1\}\}"/g, String(hoodiesID))
        .replace(/"\{\{VARIANT_TYPE_COLOR\}\}"/g, String(colorVariantTypeID))
        .replace(/"\{\{VARIANT_TYPE_SIZE\}\}"/g, String(sizeVariantTypeID))
        .replace(/"\{\{RELATED_PRODUCT_1\}\}"/g, String(hatID)),
    ),
  })

  let hoodieID: number | string = productHoodie.id

  if (payload.db.defaultIDType === 'text') {
    hoodieID = `"${hoodieID}"`
  }

  const [
    smallWhiteHoodieVariant,
    mediumWhiteHoodieVariant,
    largeWhiteHoodieVariant,
    xlargeWhiteHoodieVariant,
  ] = await Promise.all(
    [smallVariantOptionID, mediumVariantOptionID, largeVariantOptionID, xlargeVariantOptionID].map(
      (id) =>
        payload.create({
          collection: 'variants',
          depth: 0,
          data: JSON.parse(
            JSON.stringify(variantHoodieData)
              .replace(/"\{\{VARIANT_OPTION_1\}\}"/g, String(whiteVariantOptionID))
              .replace(/"\{\{VARIANT_OPTION_2\}\}"/g, String(id))
              .replace(/"\{\{PRODUCT\}\}"/g, String(hoodieID)),
          ),
        }),
    ),
  )

  await Promise.all(
    [smallVariantOptionID, mediumVariantOptionID, largeVariantOptionID, xlargeVariantOptionID].map(
      (id) =>
        payload.create({
          collection: 'variants',
          depth: 0,
          data: {
            ...JSON.parse(
              JSON.stringify(variantHoodieData)
                .replace(/"\{\{VARIANT_OPTION_1\}\}"/g, String(blackVariantOptionID))
                .replace(/"\{\{VARIANT_OPTION_2\}\}"/g, String(id))
                .replace(/"\{\{PRODUCT\}\}"/g, String(hoodieID)),
            ),
            ...(id === mediumVariantOptionID
              ? {
                  inventory: 0, // intentionally set medium variant to 0 inventory
                }
              : {}),
          },
        }),
    ),
  )

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: JSON.parse(JSON.stringify(contactFormData)),
  })

  let contactFormID: number | string = contactForm.id

  if (payload.db.defaultIDType === 'text') {
    contactFormID = `"${contactFormID}"`
  }

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: JSON.parse(
        JSON.stringify(home)
          .replace(/"\{\{IMAGE_1\}\}"/g, String(imageHomeID))
          .replace(/"\{\{IMAGE_2\}\}"/g, String(image2ID)),
      ),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: JSON.parse(
        JSON.stringify(contactPageData).replace(
          /"\{\{CONTACT_FORM_ID\}\}"/g,
          String(contactFormID),
        ),
      ),
    }),
  ])

  payload.logger.info(`— Seeding addresses...`)

  const customerUSAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUSData as Address),
    },
  })

  const customerUKAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUKData as Address),
    },
  })

  payload.logger.info(`— Seeding transactions...`)

  const pendingTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'USD',
      customer: customer.id,
      paymentMethod: 'stripe',
      stripe: {
        customerID: 'cus_123',
        paymentIntentID: 'pi_123',
      },
      status: 'pending',
      billingAddress: baseAddressUSData,
    },
  })

  const succeededTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'USD',
      customer: customer.id,
      paymentMethod: 'stripe',
      stripe: {
        customerID: 'cus_123',
        paymentIntentID: 'pi_123',
      },
      status: 'succeeded',
      billingAddress: baseAddressUSData,
    },
  })

  let succeededTransactionID: number | string = succeededTransaction.id

  if (payload.db.defaultIDType === 'text') {
    succeededTransactionID = `"${succeededTransactionID}"`
  }

  payload.logger.info(`— Seeding carts...`)

  const openCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      status: 'open',
      items: [
        {
          product: productHoodie.id,
          variant: mediumWhiteHoodieVariant.id,
          quantity: 1,
        },
      ],
    },
  })

  const abandonedCart = await payload.create({
    collection: 'carts',
    data: {
      currency: 'USD',
      status: 'abandoned',
      items: [
        {
          product: productMousepad.id,
          quantity: 1,
        },
      ],
    },
  })

  const completedCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      status: 'completed',
      subtotal: 7499,
      items: [
        {
          product: productHat.id,
          variant: variantHatWhite.id,
          quantity: 1,
        },
        {
          product: productHoodie.id,
          variant: mediumWhiteHoodieVariant.id,
          quantity: 1,
        },
      ],
    },
  })

  let completedCartID: number | string = completedCart.id

  if (payload.db.defaultIDType === 'text') {
    completedCartID = `"${completedCartID}"`
  }

  payload.logger.info(`— Seeding orders...`)

  const orderInCompleted = await payload.create({
    collection: 'orders',
    data: {
      amount: 7499,
      currency: 'USD',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productHat.id,
          variant: variantHatWhite.id,
          quantity: 1,
        },
        {
          product: productHoodie.id,
          variant: mediumWhiteHoodieVariant.id,
          quantity: 1,
        },
      ],
      status: 'completed',
      transactions: [succeededTransaction.id],
    },
  })

  const orderInProcessing = await payload.create({
    collection: 'orders',
    data: {
      amount: 7499,
      currency: 'USD',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productHat.id,
          variant: variantHatWhite.id,
          quantity: 1,
        },
        {
          product: productHoodie.id,
          variant: mediumWhiteHoodieVariant.id,
          quantity: 1,
        },
      ],
      status: 'processing',
      transactions: [succeededTransaction.id],
    },
  })

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Home',
              url: '/',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Shop',
              url: '/shop',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Account',
              url: '/account',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
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
              label: 'Find my order',
              url: '/find-order',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
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
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}

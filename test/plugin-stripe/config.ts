import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { stripePlugin } from '@payloadcms/plugin-stripe'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Customers } from './collections/Customers.js'
import { Products } from './collections/Products.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'
import { subscriptionCreatedOrUpdated } from './webhooks/subscriptionCreatedOrUpdated.js'
import { subscriptionDeleted } from './webhooks/subscriptionDeleted.js'
import { syncPriceJSON } from './webhooks/syncPriceJSON.js'

process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET = 'whsec_123'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Products, Customers],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es', 'de'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await seed(payload)
  },
  plugins: [
    stripePlugin({
      isTestKey: true,
      logs: true,
      rest: false,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET,
      sync: [
        {
          collection: 'customers',
          fields: [
            {
              fieldPath: 'name',
              stripeProperty: 'name',
            },
            {
              fieldPath: 'email',
              stripeProperty: 'email',
            },
            // NOTE: nested fields are not supported yet, because the Stripe API keeps everything separate at the top-level
            // because of this, we need to wire our own custom webhooks to handle these changes
            // In the future, support for nested fields may look something like this:
            // {
            //   field: 'subscriptions.name',
            //   property: 'plan.name',
            // }
          ],
          stripeResourceType: 'customers',
          stripeResourceTypeSingular: 'customer',
        },
        {
          collection: 'products',
          fields: [
            {
              fieldPath: 'name',
              stripeProperty: 'name',
            },
            {
              fieldPath: 'price.stripePriceID',
              stripeProperty: 'default_price',
            },
          ],
          stripeResourceType: 'products',
          stripeResourceTypeSingular: 'product',
        },
      ],
      webhooks: {
        'customer.subscription.created': subscriptionCreatedOrUpdated,
        'customer.subscription.deleted': subscriptionDeleted,
        'customer.subscription.updated': subscriptionCreatedOrUpdated,
        'product.created': syncPriceJSON,
        'product.updated': syncPriceJSON,
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

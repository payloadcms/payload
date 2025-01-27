import stripePlugin from '../../packages/plugin-stripe/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Customers } from './collections/Customers'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { seed } from './seed'
import { subscriptionCreatedOrUpdated } from './webhooks/subscriptionCreatedOrUpdated'
import { subscriptionDeleted } from './webhooks/subscriptionDeleted'
import { syncPriceJSON } from './webhooks/syncPriceJSON'

process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET = 'whsec_123'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'

export default buildConfigWithDefaults({
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
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      isTestKey: true,
      logs: true,
      sync: [
        {
          collection: 'customers',
          stripeResourceType: 'customers',
          stripeResourceTypeSingular: 'customer',
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
        },
        {
          collection: 'products',
          stripeResourceType: 'products',
          stripeResourceTypeSingular: 'product',
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
        },
      ],
      rest: false,
      webhooks: {
        'customer.subscription.created': subscriptionCreatedOrUpdated,
        'customer.subscription.updated': subscriptionCreatedOrUpdated,
        'customer.subscription.deleted': subscriptionDeleted,
        'product.created': syncPriceJSON,
        'product.updated': syncPriceJSON,
      },
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET,
    }),
  ],
})

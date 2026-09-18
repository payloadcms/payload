import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { ecommercePlugin, EUR, USD } from '@payloadcms/plugin-ecommerce'
import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'

import type { EcommercePluginConfig } from '../../packages/plugin-ecommerce/src/types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export const currenciesConfig: NonNullable<EcommercePluginConfig['currencies']> = {
  defaultCurrency: 'USD',
  supportedCurrencies: [
    USD,
    EUR,
    {
      code: 'JPY',
      decimals: 0,
      label: 'Japanese Yen',
      symbol: '¥',
    },
  ],
}

export default buildConfigWithDefaults({
  suite: 'plugin-ecommerce',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Users, Media],
    jobs: {
      autoRun: undefined,
    },
    maxDepth: 10,
    plugins: [
      ecommercePlugin({
        access: {
          adminOnlyFieldAccess: ({ req }) => Boolean(req.user),
          adminOrPublishedStatus: ({ req }) => {
            if (req.user) {
              return true
            }

            return {
              _status: {
                equals: 'published',
              },
            }
          },
          customerOnlyFieldAccess: ({ req }) => Boolean(req.user),
          isAdmin: ({ req }) => Boolean(req.user),
          isAuthenticated: ({ req }) => Boolean(req.user),
          isCustomer: ({ req }) => Boolean(req.user),
          isDocumentOwner: ({ req }) => {
            if (req.user) {
              return {
                customer: {
                  equals: req.user.id,
                },
              }
            }
            return false
          },
        },
        carts: {
          allowGuestCarts: true,
        },
        currencies: currenciesConfig,
        customers: {
          slug: 'users',
        },
        payments: {
          paymentMethods: [
            stripeAdapter({
              publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
              secretKey: process.env.STRIPE_SECRET_KEY!,
              webhooks: {
                'payment_intent.succeeded': ({ event, req }) => {
                  console.log({ data: event.data.object, event })
                  req.payload.logger.info('Payment succeeded')
                },
              },
              webhookSecret: process.env.STRIPE_WEBHOOKS_SECRET!,
            }),
          ],
        },
        products: {
          productsCollectionOverride: ({ defaultCollection }) => ({
            ...defaultCollection,
            admin: {
              ...defaultCollection.admin,
              defaultColumns: ['name', ...(defaultCollection.admin?.defaultColumns ?? [])],
              useAsTitle: 'name',
            },
            fields: [
              {
                name: 'name',
                type: 'text',
                required: true,
              },
              ...defaultCollection.fields,
            ],
          }),
          variants: true,
        },
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await seed(payload)
  },
})

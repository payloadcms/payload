import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { EUR, USD } from '@payloadcms/plugin-ecommerce/currencies'
import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'

import type { EcommercePluginConfig } from '../../packages/plugin-ecommerce/src/types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export const currenciesConfig: NonNullable<EcommercePluginConfig['currencies']> = {
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
  defaultCurrency: 'USD',
}

export default buildConfigWithDefaults({
  collections: [Users, Media],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  maxDepth: 10,
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
  jobs: {
    autoRun: undefined,
  },
  plugins: [
    ecommercePlugin({
      access: {
        isAdmin: ({ req }) => Boolean(req.user),
        isAdminField: ({ req }) => Boolean(req.user),
        isAdminOrOwner: ({ req }) => Boolean(req.user),
        isCustomerField: ({ req }) => Boolean(req.user),
        isAdminOrPublished: ({ req }) => {
          if (req.user) {
            return true
          }

          return {
            _status: {
              equals: 'published',
            },
          }
        },
      },
      customers: {
        slug: 'users',
      },
      products: {
        variants: true,
      },
      payments: {
        paymentMethods: [
          stripeAdapter({
            secretKey: process.env.STRIPE_SECRET_KEY!,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
            webhookSecret: process.env.STRIPE_WEBHOOKS_SECRET!,
            webhooks: {
              'payment_intent.succeeded': ({ event, req }) => {
                console.log({ event, data: event.data.object })
                req.payload.logger.info('Payment succeeded')
              },
            },
          }),
        ],
      },
      currencies: currenciesConfig,
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

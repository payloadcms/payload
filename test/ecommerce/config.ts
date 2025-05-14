import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { EUR, JPY, USD } from '@payloadcms/ecommerce/currencies'
import { stripeAdapter } from '@payloadcms/ecommerce/payments/stripe'
import { ecommercePlugin } from '@payloadcms/ecommerce/plugin'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  collections: [Users, Media],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
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
    ecommercePlugin({
      variants: true,
      products: true,
      orders: true,
      transactions: true,
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
      currencies: {
        supportedCurrencies: [USD, JPY, EUR],
        defaultCurrency: 'USD',
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

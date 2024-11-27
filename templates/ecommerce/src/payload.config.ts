import type { GenerateTitle } from '@payloadcms/plugin-seo/types'

import { Page, Product } from '@/payload-types'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { stripePlugin } from '@payloadcms/plugin-stripe'
import {
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  UnderlineFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DocumentInfoContext } from '@payloadcms/ui'
import dotenv from 'dotenv'
import path from 'path'
import { buildConfig } from 'payload'
// import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Orders } from '@/collections/Orders'
import { Pages } from '@/collections/Pages'
import { Products } from '@/collections/Products'
import { Users } from '@/collections/Users'
import { BeforeDashboard } from '@/components/BeforeDashboard'
import { BeforeLogin } from '@/components/BeforeLogin'
import { createPaymentIntent } from '@/endpoints/create-payment-intent'
import { customersProxy } from '@/endpoints/customers'
import { productsProxy } from '@/endpoints/products'
import { seed } from '@/endpoints/seed'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { paymentSucceeded } from '@/stripe/webhooks/paymentSucceeded'
import { productUpdated } from '@/stripe/webhooks/productUpdated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export type GenerateTitle2<T = unknown> = (args: {
  doc: T
  locale?: string
}) => Promise<string> | string

const generateTitle: GenerateTitle = <Page>({ doc }) => {
  return `${doc?.title ?? ''} | My Store`
}

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  collections: [Users, Products, Pages, Categories, Media, Orders],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
      ]
    },
  }),
  email: nodemailerAdapter(),
  endpoints: [
    {
      handler: productsProxy,
      method: 'get',
      path: '/stripe/products',
    },
    {
      handler: createPaymentIntent,
      method: 'post',
      path: '/create-payment-intent',
    },
    /*
    {
      handler: customersProxy,
      method: 'get',
      path: '/stripe/customers',
    }, */
    // The seed endpoint is used to populate the database with some example data
    // You should delete this endpoint before deploying your site to production
    /* {
      handler: seed,
      method: 'get',
      path: '/seed',
    }, */
  ],
  globals: [Footer, Header],
  plugins: [
    stripePlugin({
      isTestKey: Boolean(process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY),
      logs: true,
      rest: false,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET,
      webhooks: {
        'payment_intent.succeeded': paymentSucceeded,
        'product.updated': productUpdated,
      },
    }),
    redirectsPlugin({
      collections: ['pages', 'products'],
    }),
    formBuilderPlugin({
      fields: {
        payment: false,
      },
      formOverrides: {
        fields: ({ defaultFields }) => {
          return defaultFields.map((field) => {
            if ('name' in field && field.name === 'confirmationMessage') {
              return {
                ...field,
                editor: lexicalEditor(),
              }
            }
            return field
          })
        },
      },
    }),
    seoPlugin({
      collections: ['pages', 'products'],
      generateTitle,
      uploadsCollection: 'media',
    }),
    payloadCloudPlugin(),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.

  // This is temporary - we may make an adapter pattern
  // for this before reaching 3.0 stable

  // sharp,
})

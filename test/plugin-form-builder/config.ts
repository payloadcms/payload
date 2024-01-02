import dotenv from 'dotenv'
import path from 'path'

import type { Block } from '../../packages/payload/src/fields/config/types'

import formBuilder, { fields as formFields } from '../../packages/plugin-form-builder/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Pages } from './collections/Pages'
import { SentEmails } from './collections/SentEmails'
import { Users } from './collections/Users'
import { seed } from './seed'
import { sentEmailSlug } from './shared'

dotenv.config({
  path: path.resolve(__dirname, '.env'),
})

const colorField: Block = {
  slug: 'color',
  labels: {
    singular: 'Color',
    plural: 'Colors',
  },
  fields: [
    {
      name: 'value',
      type: 'text',
    },
  ],
}

export default buildConfigWithDefaults({
  collections: [Pages, SentEmails, Users],
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
    formBuilder({
      // handlePayment: handleFormPayments,
      beforeEmail: (emails) => {
        // send outgoing emails to the sent-emails collection for testing purposes
        emails.map(async (email) => {
          console.log(email)
          try {
            await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/${sentEmailSlug}`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(email),
            })
          } catch (error) {
            console.log(error)
            // do nothing
          }
        })
        return emails
      },
      redirectRelationships: ['pages'],
      formOverrides: {
        // labels: {
        //   singular: 'Contact Form',
        //   plural: 'Contact Forms'
        // },
        fields: [
          {
            name: 'custom',
            type: 'text',
          },
        ],
      },
      fields: {
        payment: true,
        colorField,
        text: {
          ...formFields.text,
          labels: {
            singular: 'Custom Text Field',
            plural: 'Custom Text Fields',
          },
        },
        // payment: {
        //     paymentProcessor: {
        //       options: [
        //         {
        //           label: 'Stripe',
        //           value: 'stripe'
        //         },
        //       ],
        //       defaultValue: 'stripe',
        //     },
        // },
      },
    }),
  ],
})

import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { BeforeEmail } from '@payloadcms/plugin-form-builder/types'
import type { Block, Field } from 'payload'

//import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { formBuilderPlugin, fields as formFields } from '@payloadcms/plugin-form-builder'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import type { FormSubmission } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Pages } from './collections/Pages.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

const colorField: Block = {
  slug: 'color',
  fields: [
    {
      name: 'value',
      type: 'text',
    },
  ],
  labels: {
    plural: 'Colors',
    singular: 'Color',
  },
}

const beforeEmail: BeforeEmail<FormSubmission> = (emails, { req: { payload }, originalDoc }) => {
  return emails
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Pages, Users],
  editor: lexicalEditor({}),
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
  //email: nodemailerAdapter(),
  plugins: [
    formBuilderPlugin({
      // handlePayment: handleFormPayments,
      //defaultToEmail: 'devs@payloadcms.com',
      fields: {
        colorField,
        payment: true,
        text: {
          ...formFields.text,
          labels: {
            plural: 'Custom Text Fields',
            singular: 'Custom Text Field',
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
      beforeEmail,
      formOverrides: {
        // labels: {
        //   singular: 'Contact Form',
        //   plural: 'Contact Forms'
        // },
        fields: ({ defaultFields }) => {
          return [
            ...defaultFields,
            {
              name: 'custom',
              type: 'text',
            },
          ]
        },
      },
      formSubmissionOverrides: {
        fields: ({ defaultFields }) => {
          const modifiedFields: Field[] = defaultFields.map((field) => {
            if ('name' in field && field.type === 'group' && field.name === 'payment') {
              return {
                ...field,
                fields: [
                  ...field.fields, // comment this out to override payments group entirely
                  {
                    name: 'stripeCheckoutSession',
                    type: 'text',
                  },
                ],
              }
            }

            return field
          })

          return [
            ...modifiedFields,
            {
              name: 'custom',
              type: 'text',
            },
          ]
        },
      },
      redirectRelationships: ['pages'],
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

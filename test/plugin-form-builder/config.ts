import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { BeforeEmail } from '@payloadcms/plugin-form-builder/types'
import type { Block, CollectionConfig, Field } from 'payload'

//import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { formBuilderPlugin, fields as formFields } from '@payloadcms/plugin-form-builder'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import type { FormSubmission } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Documents } from './collections/Documents.js'
import { Media } from './collections/Media.js'
import { Pages } from './collections/Pages.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'
import { documentsSlug, mediaSlug } from './shared.js'

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
  collections: [Pages, Users, Media, Documents],
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
        roles: ['admin'],
      },
    })

    await seed(payload)
  },
  // email: nodemailerAdapter(),
  plugins: [
    formBuilderPlugin({
      // handlePayment: handleFormPayments,
      // defaultToEmail: 'devs@payloadcms.com',
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
        date: {
          ...formFields.date,
          fields: [
            ...(formFields.date && 'fields' in formFields.date
              ? formFields.date.fields.map((field) => {
                  if ('name' in field && field.name === 'defaultValue') {
                    return {
                      ...field,
                      timezone: true,
                      admin: {
                        ...field.admin,
                        description: 'This is a date field',
                      },
                    } as Field
                  }
                  return field
                })
              : []),
          ],
        },
        upload: true,
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
      uploadCollections: [mediaSlug, documentsSlug],
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
        access: {
          update: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
        },
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

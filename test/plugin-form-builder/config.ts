import type { Block } from '../../packages/payload/src/fields/config/types'

import formBuilder, { fields as formFields } from '../../packages/plugin-form-builder/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { seed } from './seed'

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
  collections: [Pages, Users],
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
      // beforeEmail: prepareFormEmails,
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

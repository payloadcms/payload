import type { Block } from '../../packages/payload/src/fields/config/types.js'

import formBuilder, { fields as formFields } from '../../packages/plugin-form-builder/src/index.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Pages } from './collections/Pages.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

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

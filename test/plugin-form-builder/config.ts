import type { Block } from '../../packages/payload/src/fields/config/types.js'

import formBuilder, { fields as formFields } from '../../packages/plugin-form-builder/src/index.js'
import { slateEditor } from '../../packages/richtext-slate/src/index.js'
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

export default buildConfigWithDefaults({
  collections: [Pages, Users],
  editor: slateEditor({}),
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
      redirectRelationships: ['pages'],
    }),
  ],
})

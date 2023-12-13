import type { Block } from 'payload/types'

import path from 'path'
import { buildConfig } from 'payload/config'

// import formBuilderPlugin from '../../dist';
import formBuilderPlugin, { fields } from '../../src'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'

const colorField: Block = {
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
  slug: 'color',
}

export default buildConfig({
  admin: {
    user: Users.slug,
    webpack: (config) => {
      const newConfig = {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve.alias,
            payload: path.join(__dirname, '../node_modules/payload'),
            react: path.join(__dirname, '../node_modules/react'),
            'react-dom': path.join(__dirname, '../node_modules/react-dom'),
          },
        },
      }

      return newConfig
    },
  },
  collections: [Users, Pages],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'it'],
  },
  plugins: [
    formBuilderPlugin({
      // handlePayment: handleFormPayments,
      // beforeEmail: prepareFormEmails,
      fields: {
        colorField,
        payment: true,
        text: {
          ...fields.text,
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
            name: 'name',
            type: 'text',
          },
        ],
      },
      redirectRelationships: ['pages'],
    }),
  ],
  serverURL: 'http://localhost:3000',
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})

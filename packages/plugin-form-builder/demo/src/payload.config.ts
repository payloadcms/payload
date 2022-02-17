import { buildConfig } from 'payload/config';
import path from 'path';
import formBuilderPlugin from '../../dist';
// import formBuilderPlugin from '../../src';
import { Users } from './collections/Users';
import { Pages } from './collections/Pages';

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    Pages
  ],
  plugins: [
    formBuilderPlugin({
      redirectRelationships: [
        'pages'
      ],
      fields: {
        payment: true,
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
        // handlePayment: handleFormPayments,
        // beforeEmail: prepareFormEmails,
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
});

import { buildConfig } from 'payload/config';
import path from 'path';
import stripePlugin from '../../src';
import Users from './collections/Users';
import Customers from './collections/Customers';
import { subscriptionCreatedOrUpdated } from './webhooks/subscriptionCreatedOrUpdated';

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_CMS_URL,
  admin: {
    user: Users.slug,
    webpack: (config) => {
      const newConfig = {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve.alias,
            "payload": path.join(__dirname, "../node_modules/payload"),
          },
        },
      };

      return newConfig;
    },
  },
  collections: [
    Users,
    Customers
  ],
  localization: {
    locales: [
      'en',
      'es',
      'de',
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  plugins: [
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      sync: [
        {
          collection: 'customers',
          resource: 'customers',
          resourceSingular: 'customer',
          fields: [
            {
              field: 'name',
              property: 'name',
            },
            {
              field: 'email',
              property: 'email',
            },
            // NOTE: nested fields are not supported yet, because the Stripe API keeps everything separate at the top-level
            // because of this, we need to wire our own custom webhooks to handle these changes
            // In the future, support for nested fields may something like this:
            // {
            //   field: 'subscriptions.name',
            //   property: 'plan.nme',
            // }
          ]
        },
      ],
      webhooks: {
        'customer.subscription.created': subscriptionCreatedOrUpdated,
        'customer.subscription.updated': subscriptionCreatedOrUpdated
      },
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET,
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
});

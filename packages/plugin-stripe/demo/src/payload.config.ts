import { buildConfig } from 'payload/config';
import path from 'path';
// import stripe from '../../dist';
import stripe from '../../src';
import Users from './collections/Users';
import Customers from './collections/Customers';
import { handleUpdatedSubscription } from './webhooks/handleUpdatedSubscription';

export default buildConfig({
  serverURL: 'http://localhost:3000',
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
    stripe({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeWebhookEndpointSecret: process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET,
      webhooks: {
        'customer.subscription.updated': handleUpdatedSubscription
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
});

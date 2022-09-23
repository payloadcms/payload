import { buildConfig } from 'payload/config';
import path from 'path';
import stripePlugin from '../../src';
import Users from './collections/Users';
import Customers from './collections/Customers';
import { handleWebhooks } from './webhooks/handleWebhooks';

const mockModulePath = path.resolve(__dirname, 'mocks/serverModule.js');

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
            "express": mockModulePath,
            [path.resolve(__dirname, 'hooks/createNewStripeCustomer')]: mockModulePath,
            [path.resolve(__dirname, 'hooks/syncExistingStripeCustomer')]: mockModulePath,
            [path.resolve(__dirname, 'hooks/deleteStripeCustomer')]: mockModulePath,
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
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET,
      webhooks: handleWebhooks
    }),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts')
  },
});

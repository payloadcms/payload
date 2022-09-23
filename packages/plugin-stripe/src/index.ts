import { Config } from 'payload/config';
import { stripeREST } from './routes/rest';
// import { stripeWebhooks } from './routes/webhooks';
// import express from 'express';
import { StripeConfig } from './types';
import { extendWebpackConfig } from './extendWebpackConfig';
import { createNewStripeCustomer } from './hooks/createNewStripeCustomer';
import { syncExistingStripeCustomer } from './hooks/syncExistingStripeCustomer';
import { deleteStripeCustomer } from './hooks/deleteStripeCustomer';

const stripePlugin = (stripeConfig: StripeConfig) => (config: Config): Config => {
  const { collections } = config;

  return ({
    ...config,
    admin: {
      ...config.admin,
      webpack: extendWebpackConfig(config),
    },
    endpoints: [
      ...config?.endpoints || [],
      // {
      //   path: '/stripe/webhooks',
      //   method: 'post',
      //   root: true,
      //   handler: [
      //     express.raw({ type: 'application/json' }),
      //     (req, res, next) => {
      //       stripeWebhooks(req, res, next, stripeConfig)
      //     }
      //   ]
      // },
      {
        path: '/stripe/rest',
        method: 'post',
        handler: (req, res, next) => {
          stripeREST(req, res, next, stripeConfig)
        }
      },
    ],
    collections: collections?.map((collection) => {
      const {
        hooks: existingHooks
      } = collection;

      const enabledCollections = stripeConfig.collections || [];

      const isEnabled = enabledCollections.indexOf(collection.slug) > -1;

      if (isEnabled) {
        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            beforeValidate: [
              ...(existingHooks?.beforeValidate || []),
              createNewStripeCustomer
            ],
            afterChange: [
              ...(existingHooks?.afterChange || []),
              syncExistingStripeCustomer
            ],
            afterDelete: [
              ...(existingHooks?.afterDelete || []),
              deleteStripeCustomer
            ],
          },
          fields: [
            ...collection.fields,
            {
              name: 'stripeCustomerID',
              label: 'Stripe Customer ID',
              type: 'text',
              saveToJWT: true,
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
            {
              name: 'isSyncedToStripe',
              label: 'Synced To Sync',
              type: 'checkbox',
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            }
          ]
        };
      }

      return collection;
    })
  })
};

export default stripePlugin;

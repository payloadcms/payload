import { Config } from 'payload/config';
import { stripeREST } from './routes/rest';
import { stripeWebhooks } from './routes/webhooks';
import express from 'express';
import { StripeConfig } from './types';
import { extendWebpackConfig } from './extendWebpackConfig';
import { createNewInStripe } from './hooks/createNewInStripe';
import { syncExistingWithStripe } from './hooks/syncExistingWithStripe';
import { deleteFromStripe } from './hooks/deleteFromStripe';

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
      {
        path: '/stripe/webhooks',
        method: 'post',
        root: true,
        handler: [
          express.raw({ type: 'application/json' }),
          (req, res, next) => {
            stripeWebhooks(req, res, next, stripeConfig)
          }
        ]
      },
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

      const syncConfig = stripeConfig.sync?.find((sync) => sync.collection === collection.slug);

      if (syncConfig) {
        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            beforeValidate: [
              ...(existingHooks?.beforeValidate || []),
              async (args) => {
                createNewInStripe({
                  ...args,
                  collection,
                  stripeConfig,
                })
              }
            ],
            afterChange: [
              ...(existingHooks?.afterChange || []),
              async (args) => {
                syncExistingWithStripe({
                  ...args,
                  collection,
                  stripeConfig
                })
              }
            ],
            afterDelete: [
              ...(existingHooks?.afterDelete || []),
              async (args) => {
                deleteFromStripe({
                  ...args,
                  collection,
                  stripeConfig
                })
              }
            ],
          },
          fields: [
            ...collection.fields,
            {
              name: 'stripeID',
              label: 'Stripe ID',
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

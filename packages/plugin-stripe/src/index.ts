import { Config } from 'payload/config';
import { stripeREST } from './routes/rest';
import { stripeWebhooks } from './routes/webhooks';
import express from 'express';
import { SanitizedStripeConfig, StripeConfig } from './types';
import { extendWebpackConfig } from './extendWebpackConfig';
import { createNewInStripe } from './hooks/createNewInStripe';
import { syncExistingWithStripe } from './hooks/syncExistingWithStripe';
import { deleteFromStripe } from './hooks/deleteFromStripe';
import { LinkToDoc } from './ui/LinkToDoc';

const stripePlugin = (incomingStripeConfig: StripeConfig) => (config: Config): Config => {
  const { collections } = config;

  // set config defaults here
  const stripeConfig: SanitizedStripeConfig = {
    ...incomingStripeConfig,
    sync: incomingStripeConfig?.sync || []
  }

  // NOTE: env variables are never passed to the client, and bc we use theme in the admin panel
  // so unfortunately we must set the 'isTestKey' property on the config instead of using the following code:
  // const isTestKey = stripeConfig.stripeSecretKey?.startsWith('sk_test_');

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
            stripeWebhooks({
              req,
              res,
              next,
              config,
              stripeConfig
            })
          }
        ]
      },
      {
        path: '/stripe/rest',
        method: 'post',
        handler: (req, res, next) => {
          stripeREST({
            req,
            res,
            next,
            stripeConfig
          })
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
              async (args) => createNewInStripe({
                ...args,
                collection,
                stripeConfig,
              })
            ],
            beforeChange: [
              ...(existingHooks?.beforeChange || []),
              async (args) => syncExistingWithStripe({
                ...args,
                collection,
                stripeConfig
              })
            ],
            afterDelete: [
              ...(existingHooks?.afterDelete || []),
              async (args) => deleteFromStripe({
                ...args,
                collection,
                stripeConfig
              })
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
              name: 'skipSync',
              label: 'Skip Sync',
              type: 'checkbox',
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
            {
              name: 'docUrl',
              type: 'ui',
              admin: {
                position: 'sidebar',
                components: {
                  Field: (args) => LinkToDoc({
                    ...args,
                    isTestKey: stripeConfig.isTestKey,
                    stripeResourceType: syncConfig.stripeResourceType,
                    nameOfIDField: 'stripeID',
                  })
                },
              },
            },
          ]
        };
      }

      return collection;
    })
  })
}

export default stripePlugin;

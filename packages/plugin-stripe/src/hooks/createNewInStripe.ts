import { APIError } from 'payload/errors';
import Stripe from 'stripe';
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload/types';
import { StripeConfig } from '../types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' });

export type CollectionBeforeValidateHookWithArgs = (args: Parameters<CollectionBeforeValidateHook>[0] & {
  collection?: CollectionConfig,
  stripeConfig?: StripeConfig,
}) => void;

export const createNewInStripe: CollectionBeforeValidateHookWithArgs = async (args) => {
  const {
    req,
    operation,
    data,
    collection,
    stripeConfig
  } = args;

  const payload = req?.payload;

  const dataRef = data || {};

  if (payload) {
    if (dataRef.isSyncedToStripe) {
      // payload.logger.info(`Bypassing collection-level hooks.`);
    } else {
      // Initialize false so that all Payload events sync to Stripe
      // conditionally set to true to prevent events that originate from webhooks from triggering an unnecessary sync
      dataRef.isSyncedToStripe = false;

      const { slug: collectionSlug } = collection || {};

      const syncConfig = stripeConfig?.sync?.find((syncConfig) => syncConfig.collection === collectionSlug);

      if (syncConfig) {
        if (operation === 'create') {
          payload.logger.info(`A new '${collectionSlug}' document has been created, syncing with Stripe.`);

          // TODO: if we're going to reenable this next block, then we need to somehow flag the collection as an "auth" collection or similar
          // First, ensure this customer is unique based on 'email'
          // let existingCustomer = null;
          // if (data?.email) {
          //   const customerQuery = await payload.find({
          //     collection: 'customers',
          //     where: {
          //       email: {
          //         equals: data.email,
          //       },
          //     },
          //   });
          // }
          // existingCustomer = customerQuery.docs[0];
          // if (existingCustomer) {
          //   payload.logger.error(`- Account already exists with e-mail: ${data.email}. If this is your e-mail, please log in and checkout again.`);
          // }

          if (process.env.NODE_ENV === 'test') {
            dataRef.stripeID = 'test';
          } else {
            payload.logger.info(`- Creating new '${syncConfig.object}' object in Stripe.`);

            const syncedFields = syncConfig.fields.reduce((acc, field) => {
              const { field: fieldName, property } = field;
              acc[fieldName] = dataRef[property];
              return acc;
            }, {} as Record<string, any>);

            try {
              // NOTE: ts will surface an issue here once the 'syncConfig.object' type improves in 'types.ts', where the 'create' method is not on all Stripe resources
              const stripeObject = await stripe?.[syncConfig.object]?.create(syncedFields);

              payload.logger.info(`- Successfully created new '${syncConfig.object}' object in Stripe with ID: '${stripeObject.id}'.`);

              dataRef.stripeID = stripeObject.id;

              // NOTE: this is to prevent sync in the "afterChange" hook
              dataRef.isSyncedToStripe = true;
            } catch (error: any) {
              payload.logger.error(`- Failed to create new '${syncConfig.object}' object in Stripe: ${error?.message || ''}`);
            }
          }
        }
      }
    }
  }

  return dataRef;
};

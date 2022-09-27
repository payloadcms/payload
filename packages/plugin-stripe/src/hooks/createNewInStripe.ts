import { APIError } from 'payload/errors';
import Stripe from 'stripe';
import type { CollectionBeforeValidateHook, CollectionConfig, PayloadRequest } from 'payload/types';
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

  if (process.env.NODE_ENV === 'test') {
    dataRef.stripeID = 'test';
    return dataRef;
  }

  if (payload) {
    if (dataRef.skipSync) {
      // payload.logger.info(`Bypassing collection-level hooks.`);
    } else {
      // Initialize false so that all Payload events sync to Stripe
      // conditionally set to true to prevent events that originate from webhooks from triggering an unnecessary sync
      dataRef.skipSync = false;

      const { slug: collectionSlug } = collection || {};

      const syncConfig = stripeConfig?.sync?.find((syncConfig) => syncConfig.collection === collectionSlug);

      if (syncConfig) {

        const syncedFields = syncConfig.fields.reduce((acc, field) => {
          const { field: fieldName, property } = field;
          acc[fieldName] = dataRef[property];
          return acc;
        }, {} as Record<string, any>);

        if (operation === 'update') {
          // NOTE: the Stripe document will be created in the "afterChange" hook, so create a new stripe document here if no stripeID exists
          if (!dataRef.stripeID) {
            try {
              const stripeResource = await stripe?.[syncConfig.resource]?.create(syncedFields);

              payload.logger.info(`- Successfully created new '${syncConfig.resource}' resource in Stripe with ID: '${stripeResource.id}'.`);

              dataRef.stripeID = stripeResource.id;

              // NOTE: this is to prevent sync in the "afterChange" hook
              dataRef.skipSync = true;
            } catch (error: any) {
              payload.logger.error(`- Error creating Stripe document: ${error?.message || ''}`);
            }
          }
        }

        if (operation === 'create') {
          payload.logger.info(`A new '${collectionSlug}' document has been created, syncing with Stripe.`);

          try {
            payload.logger.info(`- Creating new '${syncConfig.resource}' resource in Stripe.`);

            // NOTE: ts will surface an issue here once the 'syncConfig.resource' type improves in 'types.ts', where the 'create' method is not on all Stripe resources
            const stripeResource = await stripe?.[syncConfig.resource]?.create(syncedFields);

            payload.logger.info(`- Successfully created new '${syncConfig.resource}' resource in Stripe with ID: '${stripeResource.id}'.`);

            dataRef.stripeID = stripeResource.id;

            // NOTE: this is to prevent sync in the "afterChange" hook
            dataRef.skipSync = true;
          } catch (error: any) {
            payload.logger.error(`- Failed to create new '${syncConfig.resource}' resource in Stripe: ${error?.message || ''}`);
          }
        }
      }
    }
  }

  return dataRef;
};

import type { CollectionAfterChangeHook, CollectionConfig } from 'payload/types';
import Stripe from 'stripe';
import { StripeConfig } from '../types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' });

export type CollectionAfterChangeHookWithArgs = (args: Parameters<CollectionAfterChangeHook>[0] & {
  collection?: CollectionConfig,
  stripeConfig?: StripeConfig,
}) => void;

export const syncExistingWithStripe: CollectionAfterChangeHookWithArgs = async (args) => {
  const {
    req,
    operation,
    doc,
    collection,
    stripeConfig
  } = args;

  const { payload } = req;

  const { slug: collectionSlug } = collection || {};

  if (process.env.NODE_ENV !== 'test' && !doc.skipSync) {
    const syncConfig = stripeConfig?.sync?.find((syncConfig) => syncConfig.collection === collectionSlug);

    if (syncConfig) {
      // combine all fields of this object and match their respective values within the document
      const syncedFields = syncConfig.fields.reduce((acc, field) => {
        const { field: fieldName, property } = field;
        acc[fieldName] = doc[property];
        return acc;
      }, {} as Record<string, any>);

      if (operation === 'update') {
        payload.logger.info(`Syncing changes from document with ID: '${doc?.id}' in collection: '${collectionSlug}' to Stripe.`);

        if (!doc.stripeID) {
          // NOTE: the "beforeValidate" hook populates this
          payload.logger.error(`- There is no Stripe ID for this document, skipping.`);
        } else {
          payload.logger.info(`- Syncing to Stripe ID: '${doc.stripeID}'.`);

          try {
            const stripeResource = await stripe?.[syncConfig?.resource]?.update(
              doc.stripeID,
              syncedFields
            );

            payload.logger.info(`- Successfully synced Stripe document ID: '${stripeResource.id}'.`);
          } catch (error: any) {
            payload.logger.error(`- Error syncing document with ID: '${doc.id}' to Stripe: ${error?.message || ''}`);
          }
        }
      }
    }
  }

  // Set back to false so that all changes continue to sync to Stripe, see note in './createNewInStripe.ts'
  doc.skipSync = false;

  return doc;
}

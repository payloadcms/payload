import type { CollectionAfterChangeHook, CollectionConfig } from 'payload/types';
import Stripe from 'stripe';
import { StripeConfig } from '../types';
import { APIError } from 'payload/errors';

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

  const {
    logs,
    sync
  } = stripeConfig || {};

  const { payload } = req;

  const { slug: collectionSlug } = collection || {};

  if (process.env.NODE_ENV !== 'test' && !doc.skipSync) {
    const syncConfig = sync?.find((syncConfig) => syncConfig.collection === collectionSlug);

    if (syncConfig) {
      // combine all fields of this object and match their respective values within the document
      const syncedFields = syncConfig.fields.reduce((acc, field) => {
        const { field: fieldName, property } = field;
        acc[fieldName] = doc[property];
        return acc;
      }, {} as Record<string, any>);

      if (operation === 'update') {
        if (logs) payload.logger.info(`A '${collectionSlug}' document has changed in Payload with ID: '${doc?.id}', syncing with Stripe...`);

        if (!doc.stripeID) {
          // NOTE: the "beforeValidate" hook populates this
          if (logs) payload.logger.error(`- There is no Stripe ID for this document, skipping.`);
        } else {
          if (logs) payload.logger.info(`- Syncing to Stripe ID: '${doc.stripeID}'...`);

          try {
            const stripeResource = await stripe?.[syncConfig?.resource]?.update(
              doc.stripeID,
              syncedFields
            );

            if (logs) payload.logger.info(`✅ Successfully synced Stripe document ID: '${stripeResource.id}'.`);
          } catch (error: any) {
            throw new APIError(`Failed to sync document with ID: '${doc.id}' to Stripe: ${error?.message || ''}`);
          }
        }
      }
    }
  }

  // Set back to false so that all changes continue to sync to Stripe, see note in './createNewInStripe.ts'
  doc.skipSync = false;

  return doc;
}

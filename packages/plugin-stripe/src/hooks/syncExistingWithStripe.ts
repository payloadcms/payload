import type { CollectionAfterChangeHook, CollectionConfig } from 'payload/types';
import Stripe from 'stripe';
import { StripeConfig } from '../types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' });

export const syncExistingWithStripe: CollectionAfterChangeHook = async (args: Parameters<CollectionAfterChangeHook>[0] & {
  collection?: CollectionConfig,
  stripeConfig?: StripeConfig,
}) => {
  const {
    req,
    operation,
    doc,
    collection,
    stripeConfig
  } = args;

  const { payload } = req;

  const { slug: collectionSlug } = collection || {};

  payload.logger.info(`Document with ID: '${doc?.id}' in collection: '${collectionSlug}' has been changed, syncing with Stripe`);

  if (process.env.NODE_ENV !== 'test' && !doc.isSyncedToStripe) {
    const syncConfig = stripeConfig?.sync?.find((syncConfig) => syncConfig.collection === collectionSlug);

    if (syncConfig) {
      if (operation === 'update') {
        payload.logger.info(`- Syncing Payload document with ID: '${doc.id}' to Stripe id ${doc.stripeID}.`);

        // combine all fields of this object and match their respective values within the document
        const syncedFields = syncConfig.fields.reduce((acc, field) => {
          const { field: fieldName, property } = field;
          acc[fieldName] = doc[property];
          return acc;
        }, {} as Record<string, any>);

        try {
          const stripeObject = await stripe?.[syncConfig.object]?.update(
            doc.stripeID,
            syncedFields
          );

          // Set to false so that all Payload events sync to Stripe, EXCEPT for those that originate from webhooks
          doc.isSyncedToStripe = false;

          payload.logger.info(`- Successfully synced Stripe document ID: '${stripeObject.id}'.`);
        } catch (error: any) {
          payload.logger.error(`- Error updating Stripe document ID: '${doc.stripeID}': ${error?.message || ''}`);
        }
      }
    }
  }

  return doc;
}

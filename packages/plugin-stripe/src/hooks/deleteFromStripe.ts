import type { CollectionAfterDeleteHook, CollectionConfig, } from 'payload/types';
import Stripe from 'stripe';
import { StripeConfig } from '../types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' });

export type CollectionAfterDeleteHookWithArgs = (args: Parameters<CollectionAfterDeleteHook>[0] & {
  collection?: CollectionConfig,
  stripeConfig?: StripeConfig,
}) => void;

export const deleteFromStripe: CollectionAfterDeleteHookWithArgs = async (args) => {
  const {
    req,
    doc,
    stripeConfig,
    collection,
  } = args;

  const {
    logs,
    sync
  } = stripeConfig || {};

  const { payload } = req;
  const { slug: collectionSlug } = collection || {};

  if (logs) payload.logger.info(`Document with ID: '${doc?.id}' in collection: '${collectionSlug}' has been deleted, deleting from Stripe...`);

  if (process.env.NODE_ENV !== 'test') {
    if (logs) payload.logger.info(`- Deleting Stripe document with ID: '${doc.stripeID}'...`);

    const syncConfig = sync?.find((syncConfig) => syncConfig.collection === collectionSlug);

    if (syncConfig) {
      try {
        await stripe?.[syncConfig.resource]?.del(doc.stripeID);

        if (logs) payload.logger.log(`✅ Successfully deleted Stripe document with ID: '${doc.stripeID}'.`);
      } catch (error: any) {
        if (logs) payload.logger.error(`- Error deleting Stripe document with ID: '${doc.stripeID}': ${error?.message || ''}`);
      }
    }
  }
}

import type { CollectionAfterDeleteHook, CollectionConfig, } from 'payload/types';
import Stripe from 'stripe';
import { StripeConfig } from '../types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' });

export const deleteFromStripe: CollectionAfterDeleteHook = async (args: Parameters<CollectionAfterDeleteHook>[0] & {
  collection?: CollectionConfig,
  stripeConfig?: StripeConfig,
}) => {
  const {
    req,
    doc,
    stripeConfig,
    collection,
  } = args;

  const { payload } = req;
  const { slug: collectionSlug } = collection || {};

  payload.logger.info(`Document with id: '${doc?.id}' in collection: '${collectionSlug}' has been deleted, syncing with Stripe`);

  if (process.env.NODE_ENV !== 'test') {
    payload.logger.info(`- Deleting Stripe document with ID: '${doc.stripeID}'.`);

    const syncConfig = stripeConfig?.sync?.find((syncConfig) => syncConfig.collection === collectionSlug);

    if (syncConfig) {
      try {
        await stripe?.[syncConfig.object]?.del(doc.stripeID);

        payload.logger.error(`- Successfully deleted Stripe document with ID: '${doc.stripeID}'.`);
      } catch (error: any) {
        payload.logger.error(`- Error deleting Stripe document with ID: '${doc.stripeID}': ${error?.message || ''}`);
      }
    }
  }
}

import { APIError } from 'payload/errors';
import Stripe from 'stripe';
import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload/types';
import { StripeConfig } from '../types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' });

export const createNewInStripe: CollectionBeforeValidateHook = async (args: Parameters<CollectionBeforeValidateHook>[0] & {
  collection?: CollectionConfig,
  stripeConfig?: StripeConfig,
}) => {
  const {
    req,
    operation,
    data,
    collection,
    stripeConfig
  } = args;

  const dataRef = data || {};

  const { slug: collectionSlug } = collection || {};

  const syncConfig = stripeConfig?.sync?.find((syncConfig) => syncConfig.collection === collectionSlug);

  if (req && syncConfig) {
    const { payload } = req;

    if (operation === 'create') {
      payload.logger.info(`A new ${collectionSlug} has been created, syncing with Stripe.`);

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
        if (!dataRef.isSyncedToStripe) {
          payload.logger.info(`- Creating new document in Stripe from ID: '${dataRef.id}'`);

          const syncedFields = syncConfig.fields.reduce((acc, field) => {
            const { field: fieldName, property } = field;
            acc[fieldName] = dataRef[property];
            return acc;
          }, {} as Record<string, any>);

          try {
            // NOTE: ts will surface an issue here once the 'syncConfig.object' type improves in 'types.ts', where the 'create' method is not on all Stripe resources
            const stripeObject = await stripe?.[syncConfig.object]?.create(syncedFields);

            payload.logger.info(`- Successfully created new document in Stripe. Their ID is: '${stripeObject.id}'.`);

            dataRef.stripeID = stripeObject.id;
          } catch (error: any) {
            payload.logger.error(`- Error creating new document in Stripe: ${error?.message || ''}`);
          }
        }
      }
    }

    // Set to false so that all Payload events sync to Stripe, EXCEPT for those that originate from webhooks
    dataRef.isSyncedToStripe = false;
  }

  return dataRef;
};

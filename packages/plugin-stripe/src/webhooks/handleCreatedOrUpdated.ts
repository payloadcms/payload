import { SanitizedStripeConfig, StripeWebhookHandler } from '../types';

type HandleCreatedOrUpdated = (args: Parameters<StripeWebhookHandler>[0] & {
  syncConfig: SanitizedStripeConfig['sync'][0]
}) => void;

export const handleCreatedOrUpdated: HandleCreatedOrUpdated = async (args) => {
  const {
    payload,
    event,
    config: payloadConfig,
    syncConfig
  } = args;

  payload.logger.info(`A new document was created or updated in Stripe. Syncing to Payload.`);

  const collectionSlug = syncConfig?.collection;

  const isAuthCollection = Boolean(payloadConfig?.collections?.find((collection) => collection.slug === collectionSlug)?.auth);

  const stripeDoc: any = event?.data?.object || {};
  const { id: stripeID } = stripeDoc;

  // First, search for an existing document in Payload
  const payloadQuery = await payload.find({
    collection: collectionSlug,
    where: {
      stripeID: {
        equals: stripeID,
      },
    },
  });

  const foundDoc = payloadQuery.docs[0] as any;

  // combine all properties of the Stripe doc and match their respective fields within the document
  let syncedData = syncConfig.fields.reduce((acc, field) => {
    const { field: fieldName, property } = field;
    acc[fieldName] = stripeDoc[property];
    return acc;
  }, {} as Record<string, any>);

  syncedData = {
    ...syncedData,
    stripeID,
    skipSync: true,
  }

  if (!foundDoc) {
    payload.logger.info(`- No existing document found with Stripe ID: '${stripeID}' in collection: '${collectionSlug}', creating new.`);

    // auth docs must use unique emails
    let authDoc = null;

    if (isAuthCollection) {
      try {
        if (stripeDoc?.email) {
          const authQuery = await payload.find({
            collection: collectionSlug,
            where: {
              email: {
                equals: stripeDoc.email,
              },
            },
          });

          authDoc = authQuery.docs[0] as any;

          if (authDoc) {
            payload.logger.info(`- Account already exists with e-mail: ${stripeDoc.email}, updating now.`);

            // account exists by email, so update it instead
            try {
              await payload.update({
                collection: collectionSlug,
                id: authDoc.id,
                data: syncedData,
              });
            } catch (err: any) {
              payload.logger.error(`- Error updating existing document: ${err.message}`);
            }
          }
        } else {
          payload.logger.error(`No email was provided from Stripe, cannot create new document collection '${collectionSlug}'.`);
        }
      } catch (error: any) {
        payload.logger.error(`Error looking up document in Payload: ${error?.message}`);
      }
    }

    if (!isAuthCollection || (isAuthCollection && !authDoc)) {
      try {
        await payload.create({
          collection: collectionSlug,
          data: {
            ...syncedData,
            password: 'password', // TODO: figure this out, can Payload auto-generate?
            passwordConfirm: 'password', // TODO: figure this out, can Payload auto-generate?
          },
          disableVerificationEmail: true,
        });

        payload.logger.info(`- Successfully created new document in Payload with Stripe ID: '${stripeID}'.`);
      } catch (error: any) {
        payload.logger.error(`Error creating new document in Payload: ${error?.message}`);
      }
    }
  } else {
    payload.logger.info(`- Existing document found in Payload with Stripe ID: '${stripeID}', updating now.`);

    try {
      await payload.update({
        collection: collectionSlug,
        id: foundDoc.id,
        data: syncedData,
      });

      payload.logger.info(`- Successfully updated document in Payload from Stripe ID: '${stripeID}'.`);
    } catch (error: any) {
      payload.logger.error(`Error updating document in Payload: ${error?.message}`);
    }
  }
}

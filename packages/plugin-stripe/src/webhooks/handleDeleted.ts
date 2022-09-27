import { SanitizedStripeConfig, StripeWebhookHandler } from '../types';

type HandleDeleted = (args: Parameters<StripeWebhookHandler>[0] & {
  syncConfig: SanitizedStripeConfig['sync'][0]
}) => void;

export const handleDeleted: HandleDeleted = async (args) => {
  const {
    payload,
    event,
    syncConfig
  } = args;

  const collectionSlug = syncConfig?.collection;

  const {
    id: stripeID
  }: any = event?.data?.object || {};

  try {
    const payloadQuery = await payload.find({
      collection: collectionSlug,
      where: {
        stripeID: {
          equals: stripeID,
        },
      },
    });

    const foundDoc = payloadQuery.docs[0] as any;

    if (!foundDoc) {
      payload.logger.info(`- Nothing to delete, no existing document found with Stripe ID: '${stripeID}'.`);
    }

    if (foundDoc) {
      payload.logger.info(`- Deleting Payload document with ID: '${foundDoc.id}'.`);

      try {
        payload.delete({
          collection: collectionSlug,
          id: foundDoc.id,
        });

        // NOTE: the `afterDelete` hook will trigger, which will attempt to delete the document from Stripe and safely error out
        // There is no known way of preventing this from happening. In other hooks we use the `skipSync` field, but here the document is already deleted.
        payload.logger.info(`- Successfully deleted Payload document with ID: '${foundDoc.id}'.`);
      } catch (error: any) {
        payload.logger.error(`Error deleting document: ${error?.message}`);
      }
    }
  } catch (error: any) {
    payload.logger.error(error?.message);
  }
}

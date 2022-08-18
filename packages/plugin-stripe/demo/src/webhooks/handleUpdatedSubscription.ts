import payload from 'payload';
import { WebhookHandler } from '../../../src/types';

export const handleUpdatedSubscription: WebhookHandler = async (event) => {
  try {
    const customerQuery = await payload.find({
      collection: 'customers',
      where: {
        stripeSubscriptionID: {
          equals: event.id,
        },
      },
    });

    const customer = customerQuery.docs[0] as any; // TODO: type this as Customer

    if (customer) {
      try {
        payload.update({
          collection: 'customers',
          id: customer.id,
          data: {},
        });
      } catch (error) {
        console.error(error);
      }
    } else {
      console.error(`Stripe subscription update webhook for ${event.id} could not find an associated customer.`);
    }
  } catch (error) {
    console.log(error);
  }
};

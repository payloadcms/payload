import type { CollectionAfterChangeHook } from 'payload/types';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' });

export const syncExistingStripeCustomer: CollectionAfterChangeHook = async ({ req, operation, doc }) => {
  const { payload } = req;

  if (process.env.NODE_ENV !== 'test' && !doc.isSyncedToStripe) {
    if (operation === 'update') {
      console.log(`Syncing Payload customer with ID: '${doc.id}' to Stripe.`);

      try {
        const customer = await stripe.customers.update(
          doc.stripeCustomerID,
          {
            email: doc.email,
            name: doc.name,
          }
        );

        // Set to false so that all Payload events sync to Stripe, EXCEPT for those that originate from webhooks
        doc.isSyncedToStripe = false;

        console.log(`Successfully updated customer ID: '${customer.id}' in Stripe.`);
      } catch (error: any) {
        payload.logger.error(`Error updating customer ID: '${doc.stripeCustomerID}' in Stripe: ${error?.message || ''}`);
      }
    }
  }

  return doc;
}

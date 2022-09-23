import type { CollectionAfterDeleteHook, } from 'payload/types';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' });

export const deleteStripeCustomer: CollectionAfterDeleteHook = async ({ req, doc }) => {
  const { payload } = req;

  if (process.env.NODE_ENV !== 'test') {
    console.log(`Deleting customer with ID: '${doc.stripeCustomerID}' from Stripe.`);

    try {
      await stripe.customers.del(doc.stripeCustomerID);

      console.log(`Successfully deleted customer ID: '${doc.stripeCustomerID}' from Stripe.`);
    } catch (error: any) {
      payload.logger.error(`Error deleting customer ID: '${doc.stripeCustomerID}' from Stripe: ${error?.message || ''}`);
    }
  }
}

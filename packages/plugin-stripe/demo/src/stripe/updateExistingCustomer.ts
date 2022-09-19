import type { CollectionAfterChangeHook } from 'payload/types';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' });

export const updateExistingCustomer: CollectionAfterChangeHook = async ({ req, operation, doc }) => {
  const { payload } = req;

  if (operation === 'update' && process.env.NODE_ENV !== 'test') {
    try {
      const customer = await stripe.customers.update(
        doc.stripeCustomerID,
        {
          email: doc.email,
          name: `${doc.firstName || ''} ${doc.lastName || ''}`,
        }
      );

      console.log(`Successfully updated customer: '${customer.id}' in Stripe.`);
    } catch (error) {
      payload.logger.error(error.message);
    }
  }

  return doc;
}

import type { CollectionAfterChangeHook } from 'payload/types';
import { stripeProxy } from '../../../../../src/utilities/stripeProxy';

export const updateExistingCustomer: CollectionAfterChangeHook = async ({ req, operation, doc }) => {
  const { payload } = req;

  if (operation === 'update' && process.env.NODE_ENV !== 'test') {
    try {
      const customer = await stripeProxy({
        stripeSecretKey: process.env.STRIPE_SECRET_KEY,
        stripeMethod: 'customers.update',
        stripeArgs: [
          doc.stripeCustomerID,
          {
            email: doc.email,
            name: `${doc.firstName || ''} ${doc.lastName || ''}`,
          }
        ]
      });

      if (customer.status === 200) {
        console.log('Successfully updated customer in Stripe.');
      }

      if (customer.status >= 400) {
        throw new Error(customer.message);
      }
    } catch (error) {
      payload.logger.error(error.message);
    }
  }

  return doc;
}

import { APIError } from 'payload/errors';
import type { CollectionBeforeValidateHook } from 'payload/types';
import { stripeProxy } from '../../../../../src/utilities/stripeProxy';

export const syncNewCustomer: CollectionBeforeValidateHook = async ({ req, operation, data }) => {
  const {
    payload,
  } = req;

  const dataRef = data;

  // First, ensure this customer is unique based on 'email'
  if (operation === 'create' && data.email) {
    const customerQuery = await payload.find({
      collection: 'customers',
      where: {
        email: {
          equals: data.email,
        },
      },
    });

    const existingCustomer = customerQuery.docs[0];

    if (existingCustomer) {
      throw new APIError(
        `Account already exists with e-mail: ${data.email}. If this is your e-mail, please log in and checkout again.`,
      );
    }

    if (process.env.NODE_ENV === 'test') {
      dataRef.stripeCustomerID = 'test';
    } else {
      // Send this new customer to Stripe
      try {
        const customer = await stripeProxy({
          stripeSecretKey: process.env.STRIPE_SECRET_KEY,
          stripeMethod: 'customers.create',
          stripeArgs: [{
            email: data.email,
            name: `${data.firstName || ''} ${data.lastName || ''}`,
          }]
        });

        if (customer.status === 200) {
          dataRef.stripeCustomerID = customer.data.id;
        }

        if (customer.status >= 400) {
          throw new Error(customer.message);
        }
      } catch (error) {
        throw new APIError(error.message);
      }
    }
  }

  return dataRef;
};

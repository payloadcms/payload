import { APIError } from 'payload/errors';
import Stripe from 'stripe';
import type { CollectionBeforeValidateHook } from 'payload/types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' });

export const createNewStripeCustomer: CollectionBeforeValidateHook = async ({ req, operation, data }) => {
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
      if (!data.isSyncedToStripe) {
        console.log(`Creating new customer in Stripe with email: '${data.email}'`);

        try {
          const customer = await stripe.customers.create({
            email: data.email,
            name: data.name,
          });

          console.log(`Successfully created new customer in Stripe. Their customer ID is: '${customer.id}'.`);

          dataRef.stripeCustomerID = customer.id;
          dataRef.isSyncedToStripe = true;
        } catch (error) {
          throw new APIError(error.message);
        }
      }
    }
  }

  // Set to false so that all Payload events sync to Stripe, EXCEPT for those that originate from webhooks
  dataRef.isSyncedToStripe = false;

  return dataRef;
};

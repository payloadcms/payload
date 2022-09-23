import Stripe from 'stripe';
import { StripeWebhookHandler } from '../types';

export const handleWebhooks: StripeWebhookHandler = async (payload, event) => {
  console.log(`Processing Stripe '${event.type}' webhook event with ID: '${event.id}'`);

  switch (event.type) {
    case 'customer.created': {
      const {
        name,
        id: customerID,
        email
      }: Stripe.Customer = event?.data?.object || {};

      const customerQuery = await payload.find({
        collection: 'customers',
        where: {
          or: [{
            email: {
              equals: email
            },
            stripeCustomerID: {
              equals: customerID,
            },
          }]
        },
      });

      const payloadCustomer = customerQuery.docs[0] as any; // TODO: type this as Customer

      if (!payloadCustomer) {
        console.log(`No existing customer found, creating a new customer in Payload with email: '${email}'`);

        try {
          await payload.create({
            collection: 'customers',
            data: {
              stripeCustomerID: customerID,
              name,
              email,
              password: 'password',
              passwordConfirm: 'password',
              isSyncedToStripe: true,
            },
            disableVerificationEmail: true,
          });

          console.log(`Successfully created new customer in Payload from stripe customer ID: '${customerID}'`);
        } catch (error) {
          console.error('Error creating new customer', error);
        }
      } else {
        console.log(`Existing customer found with email: '${email}', updating now`);

        try {
          await payload.update({
            collection: 'customers',
            id: payloadCustomer.id,
            data: {
              stripeCustomerID: customerID,
              name,
              email,
              isSyncedToStripe: true,
            },
          });

          console.log(`Successfully updated customer in Payload from stripe customer ID: '${customerID}'`);
        } catch (error) {
          console.error('Error updating customer', error);
        }
      }
      break;
    }
    case 'customer.updated': {
      const {
        name,
        id: customerID,
        email
      }: Stripe.Customer = event?.data?.object || {};

      try {
        const customerQuery = await payload.find({
          collection: 'customers',
          where: {
            stripeCustomerID: {
              equals: customerID,
            },
          },
        });

        const payloadCustomer = customerQuery.docs[0] as any; // TODO: type this as Customer

        if (payloadCustomer) {
          // Found existing customer, update it
          try {
            console.log(`Updating existing customer in Payload ID: '${payloadCustomer.id}'`);

            payload.update({
              collection: 'customers',
              id: payloadCustomer.id,
              data: {
                name,
                isSyncedToStripe: true,
              },
            });
          } catch (error) {
            console.error('Error updating existing customer', error);
          }
        } else {
          // No existing customer found, create a new one
          console.log(`Could not find an existing customer with Stripe customer ID: '${customerID}', creating a new one.`);

          try {
            await payload.create({
              collection: 'customers',
              data: {
                stripeCustomerID: customerID,
                name,
                email,
                // password: 'abc123',
                isSyncedToStripe: true,
              },
              disableVerificationEmail: true,
            });
          } catch (error) {
            console.error('Error creating new customer', error);
          }
        }
      } catch (error) {
        console.log(error);
      }
      break;
    }
    case 'customer.deleted': {
      const {
        id: customerID
      }: Stripe.Customer = event?.data?.object || {};

      try {
        const customerQuery = await payload.find({
          collection: 'customers',
          where: {
            stripeCustomerID: {
              equals: customerID,
            },
          },
        });

        const payloadCustomer = customerQuery.docs[0] as any; // TODO: type this as Customer

        if (!payloadCustomer) {
          console.log(`Nothing to delete, no existing customer found with Stripe customer ID: '${customerID}'`);
        }

        if (payloadCustomer) {
          console.log(`Deleting Payload customer with ID: '${payloadCustomer.id}'`);

          try {
            payload.delete({
              collection: 'customers',
              id: payloadCustomer.id,
            });

            // NOTE: the customers `afterDelete` hook will trigger, which will attempt to delete the customer from Stripe and safely error out
            // There is no known way of preventing this from happening. In other hooks we use the `isSyncedToStripe` field, but here the document is already deleted.

            console.log(`Successfully deleted Payload customer with ID: '${payloadCustomer.id}'`);
          } catch (error) {
            console.error('Error deleting customer', error);
          }
        }
      } catch (error) {
        console.log(error);
      }
      break;
    }
    default: {
      break;
    }
  }
};

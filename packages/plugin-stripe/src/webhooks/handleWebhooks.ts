import Stripe from 'stripe';
import { StripeWebhookHandler } from '../types';

export const handleWebhooks: StripeWebhookHandler = async (payload, event) => {
  payload.logger.info(`Processing Stripe '${event.type}' webhook event with ID: '${event.id}'`);

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
            stripeID: {
              equals: customerID,
            },
          }]
        },
      });

      const payloadCustomer = customerQuery.docs[0] as any; // TODO: type this as Customer

      if (!payloadCustomer) {
        payload.logger.info(`- No existing customer found, creating a new customer in Payload with email: '${email}'`);

        try {
          await payload.create({
            collection: 'customers',
            data: {
              stripeID: customerID,
              name,
              email,
              password: 'password',
              passwordConfirm: 'password',
              isSyncedToStripe: true,
            },
            disableVerificationEmail: true,
          });

          payload.logger.info(`- Successfully created new customer in Payload from stripe customer ID: '${customerID}'`);
        } catch (error) {
          payload.logger.error('Error creating new customer', error);
        }
      } else {
        payload.logger.info(`- Existing customer found with email: '${email}', updating now`);

        try {
          await payload.update({
            collection: 'customers',
            id: payloadCustomer.id,
            data: {
              stripeID: customerID,
              name,
              email,
              isSyncedToStripe: true,
            },
          });

          payload.logger.info(`- Successfully updated customer in Payload from stripe customer ID: '${customerID}'`);
        } catch (error) {
          payload.logger.error('Error updating customer', error);
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
            stripeID: {
              equals: customerID,
            },
          },
        });

        const payloadCustomer = customerQuery.docs[0] as any; // TODO: type this as Customer

        if (payloadCustomer) {
          // Found existing customer, update it
          try {
            payload.logger.info(`- Updating existing customer in Payload with ID: '${payloadCustomer.id}'`);

            payload.update({
              collection: 'customers',
              id: payloadCustomer.id,
              data: {
                name,
                isSyncedToStripe: true,
              },
            });

            payload.logger.info(`- Successfully updated customer in Payload with ID: '${payloadCustomer.id}'`);
          } catch (error) {
            payload.logger.error('Error updating existing customer', error);
          }
        } else {
          // No existing customer found, create a new one
          payload.logger.info(`- Could not find an existing customer with Stripe customer ID: '${customerID}', creating a new one.`);

          try {
            await payload.create({
              collection: 'customers',
              data: {
                stripeID: customerID,
                name,
                email,
                // password: 'abc123',
                isSyncedToStripe: true,
              },
              disableVerificationEmail: true,
            });
          } catch (error) {
            payload.logger.error('Error creating new customer', error);
          }
        }
      } catch (error) {
        payload.logger.info(error);
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
            stripeID: {
              equals: customerID,
            },
          },
        });

        const payloadCustomer = customerQuery.docs[0] as any; // TODO: type this as Customer

        if (!payloadCustomer) {
          payload.logger.info(`- Nothing to delete, no existing customer found with Stripe customer ID: '${customerID}'`);
        }

        if (payloadCustomer) {
          payload.logger.info(`- Deleting Payload customer with ID: '${payloadCustomer.id}'`);

          try {
            payload.delete({
              collection: 'customers',
              id: payloadCustomer.id,
            });

            // NOTE: the customers `afterDelete` hook will trigger, which will attempt to delete the customer from Stripe and safely error out
            // There is no known way of preventing this from happening. In other hooks we use the `isSyncedToStripe` field, but here the document is already deleted.

            payload.logger.info(`- Successfully deleted Payload customer with ID: '${payloadCustomer.id}'`);
          } catch (error) {
            payload.logger.error('Error deleting customer', error);
          }
        }
      } catch (error) {
        payload.logger.info(error);
      }
      break;
    }
    default: {
      break;
    }
  }
};

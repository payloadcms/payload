export const subscriptionCreatedOrUpdated = (args) => {
  const {
    event,
    payload,
    stripe,
    stripeConfig
  } = args;

  const customerStripeID = event.data.object.customer;

  payload.logger.info(`A new subscription was created or updated in Stripe on customer ID: ${customerStripeID}. Syncing to Payload.`);

  const eventObject = event.data.object;

  try {
    payload.logger.info(`Looking for existing Payload customer with Stripe ID: ${customerStripeID}.`);

    const foundCustomer: any = payload.find({
      collection: 'customers',
      where: {
        stripeID: customerStripeID
      }
    })

    if (foundCustomer) {
      payload.logger.info(`Found existing customer, now updating.`);

      const subscriptions = foundCustomer.subscriptions || [];
      const indexOfSubscription = subscriptions.findIndex(({ stripeID: subscriptionID }) => subscriptionID === eventObject.id);

      if (indexOfSubscription > -1) {
        // update existing subscription
        subscriptions[indexOfSubscription] = {
          name: eventObject.plan.nickname,
        };
      } else {
        // create new subscription
        subscriptions.push({
          name: eventObject.plan.nickname,
          stripeID: eventObject.id,
        })
      }

      payload.update({
        collection: 'customers',
        id: foundCustomer.id,
        data: {
          subscriptions
        }
      })

      payload.logger.info(`Successfully updated.`);
    } else {
      payload.logger.info(`No existing customer found, cannot update subscription.`);
    }
  } catch (error) {
    payload.logger.error(`Error looking up customer with Stripe ID: '${customerStripeID}': ${error?.message}`);
  }
};

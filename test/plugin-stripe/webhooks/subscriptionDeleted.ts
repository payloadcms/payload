import { APIError } from 'payload'

export const subscriptionDeleted = async (args) => {
  const {
    event,
    payload,
    // stripe,
    // stripeConfig
  } = args

  const customerStripeID = event.data.object.customer

  payload.logger.info(
    `🪝 A new subscription was deleted in Stripe on customer ID: ${customerStripeID}, deleting from Payload...`,
  )

  const {
    id: eventID,
    // plan
  } = event.data.object

  // Now look up the customer in Payload
  try {
    payload.logger.info(
      `- Looking up existing Payload customer with Stripe ID: ${customerStripeID}.`,
    )

    const customerReq: any = await payload.find({
      collection: 'customers',
      depth: 0,
      where: {
        stripeID: customerStripeID,
      },
    })

    const foundCustomer = customerReq.docs[0]

    if (foundCustomer) {
      payload.logger.info(`- Found existing customer, now updating.`)

      const subscriptions = foundCustomer.subscriptions || []
      const indexOfSubscription = subscriptions.findIndex(
        ({ stripeSubscriptionID }) => stripeSubscriptionID === eventID,
      )

      if (indexOfSubscription > -1) {
        delete subscriptions[indexOfSubscription]
      }

      try {
        await payload.update({
          id: foundCustomer.id,
          collection: 'customers',
          data: {
            skipSync: true,
            subscriptions,
          },
        })

        payload.logger.info(`✅ Successfully deleted subscription.`)
      } catch (error) {
        payload.logger.error(`- Error deleting subscription: ${error}`)
      }
    } else {
      payload.logger.info(`- No existing customer found, cannot update subscription.`)
    }
  } catch (error) {
    new APIError(
      `Error looking up customer with Stripe ID: '${customerStripeID}': ${error?.message}`,
    )
  }
}

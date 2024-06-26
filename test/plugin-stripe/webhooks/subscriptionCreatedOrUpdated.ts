import { APIError } from 'payload'

export const subscriptionCreatedOrUpdated = async (args) => {
  const {
    event,
    payload,
    // stripe,
    // stripeConfig
  } = args

  const customerStripeID = event.data.object.customer

  payload.logger.info(
    `🪝 A new subscription was created or updated in Stripe on customer ID: ${customerStripeID}, syncing to Payload...`,
  )

  const { id: eventID, plan, status: subscriptionStatus } = event.data.object

  let payloadProductID

  // First lookup the product in Payload
  try {
    payload.logger.info(`- Looking up existing Payload product with Stripe ID: ${plan.product}...`)

    const productQuery = await payload.find({
      collection: 'products',
      depth: 0,
      where: {
        stripeID: {
          equals: plan.product,
        },
      },
    })

    payloadProductID = productQuery.docs?.[0]?.id

    if (payloadProductID) {
      payload.logger.info(
        `- Found existing product with Stripe ID: ${plan.product}. Creating relationship...`,
      )
    }
  } catch (error: any) {
    payload.logger.error(`Error finding product ${error?.message}`)
  }

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
        payload.logger.info(`- Subscription already exists, now updating.`)
        // update existing subscription
        subscriptions[indexOfSubscription] = {
          product: payloadProductID,
          status: subscriptionStatus,
          stripeProductID: plan.product,
        }
      } else {
        payload.logger.info(`- This is a new subscription, now adding.`)
        // create new subscription
        subscriptions.push({
          product: payloadProductID,
          status: subscriptionStatus,
          stripeProductID: plan.product,
          stripeSubscriptionID: eventID,
        })
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

        payload.logger.info(`✅ Successfully updated subscription.`)
      } catch (error) {
        payload.logger.error(`- Error updating subscription: ${error}`)
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

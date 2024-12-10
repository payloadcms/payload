export const syncPriceJSON = async (args) => {
  const { event, payload, stripe } = args

  const customerStripeID = event.data.object.customer

  payload.logger.info(
    `🪝 A price was created or updated in Stripe on customer ID: ${customerStripeID}, syncing price JSON to Payload...`,
  )

  const { id: eventID, default_price } = event.data.object

  let payloadProductID

  // First lookup the product in Payload
  try {
    payload.logger.info(`- Looking up existing Payload product with Stripe ID: ${eventID}...`)

    const productQuery = await payload.find({
      collection: 'products',
      where: {
        stripeID: {
          equals: eventID,
        },
      },
    })

    payloadProductID = productQuery.docs?.[0]?.id

    if (payloadProductID) {
      payload.logger.info(
        `- Found existing product with Stripe ID: ${eventID}, saving price JSON...`,
      )
    }
  } catch (error: any) {
    payload.logger.error(`Error finding product ${error?.message}`)
  }

  try {
    const stripePrice = await stripe.prices.retrieve(default_price)

    await payload.update({
      id: payloadProductID,
      collection: 'products',
      data: {
        price: {
          stripeJSON: JSON.stringify(stripePrice),
        },
        skipSync: true,
      },
    })

    payload.logger.info(`✅ Successfully updated product price.`)
  } catch (error) {
    payload.logger.error(`- Error updating product price: ${error}`)
  }
}

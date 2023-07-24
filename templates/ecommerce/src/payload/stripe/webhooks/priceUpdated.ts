import type { StripeWebhookHandler } from '@payloadcms/plugin-stripe/dist/types'
import type Stripe from 'stripe'

const logs = false

export const priceUpdated: StripeWebhookHandler<{
  data: {
    object: Stripe.Price
  }
}> = async args => {
  const { event, payload, stripe } = args

  const stripeProduct = event.data.object.product
  const stripeProductID = typeof stripeProduct === 'string' ? stripeProduct : stripeProduct.id

  if (logs)
    payload.logger.info(
      `🪝 A price was created or updated in Stripe on product ID: ${stripeProductID}, syncing to Payload...`,
    )

  let payloadProductID

  // First lookup the product in Payload
  try {
    if (logs) payload.logger.info(`- Looking up existing Payload product...`)

    const productQuery = await payload.find({
      collection: 'products',
      where: {
        stripeProductID: {
          equals: stripeProductID,
        },
      },
    })

    payloadProductID = productQuery.docs?.[0]?.id

    if (payloadProductID) {
      if (logs)
        payload.logger.info(
          `- Found existing product with Stripe ID: ${stripeProductID}, saving price...`,
        )
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    payload.logger.error(`Error finding product ${msg}`)
  }

  try {
    // find all stripe prices that are assigned to "payloadProductID"
    const stripePrices = await stripe.prices.list({
      product: stripeProductID,
      limit: 100,
    })

    await payload.update({
      collection: 'products',
      id: payloadProductID,
      data: {
        priceJSON: JSON.stringify(stripePrices),
        skipSync: true,
      },
    })

    if (logs) payload.logger.info(`✅ Successfully updated product price.`)
  } catch (error: unknown) {
    payload.logger.error(`- Error updating product price: ${error}`)
  }
}

import type { Product } from '@/payload-types'
import type { StripeWebhookHandler } from '@payloadcms/plugin-stripe/types'
import type Stripe from 'stripe'

import type { InfoType } from '@/collections/Products/ui/types'

const logs = false

export const productUpdated: StripeWebhookHandler<{
  data: {
    object: Stripe.Product
  }
}> = async (args) => {
  const { event, payload, req, stripe } = args

  const {
    id: stripeProductID,
    name: stripeProductName,
    // description: stripeDescription,
    default_price: defaultPrice,
  } = event.data.object

  if (logs) payload.logger.info(`Syncing Stripe product with ID: ${stripeProductID} to Payload...`)

  let payloadProductID: string | null = null,
    stripePriceID: string | null = null
  let isVariant = false
  let product: Product | null = null

  // First lookup the product in Payload
  try {
    if (logs) payload.logger.info(`- Looking up existing Payload product...`)

    const productQuery = await payload.find({
      collection: 'products',
      req,
      where: {
        or: [
          {
            stripeProductID: {
              equals: stripeProductID,
            },
          },
          {
            'variants.variants.stripeProductID': {
              equals: stripeProductID,
            },
          },
        ],
      },
    })

    product = productQuery.docs?.[0]
    isVariant = Boolean(product.enableVariants && product.variants?.variants?.length)
    stripePriceID = typeof defaultPrice === 'string' ? defaultPrice : defaultPrice?.id || null

    payloadProductID = product.id

    if (payloadProductID) {
      if (logs)
        payload.logger.info(
          `- Found existing product with Stripe ID: ${stripeProductID}, syncing now...`,
        )
    }
    if (!stripePriceID) {
      if (logs) payload.logger.info(`- This product has no default price. Skipping sync for now...`)
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(`Error finding product ${message}`)
  }

  let price: Stripe.Price | null = null

  try {
    if (logs) payload.logger.info(`- Looking up all prices associated with this product...`)

    // Get the full price data as webhooks only return a reference to the default price
    if (stripePriceID) price = await stripe.prices.retrieve(stripePriceID)
  } catch (error: unknown) {
    payload.logger.error(`- Error looking up prices: ${error}`)
  }

  try {
    if (logs) payload.logger.info(`- Updating document...`)
    if (isVariant && product?.variants?.variants && price && price.unit_amount) {
      const variantIndex = product.variants.variants.findIndex(
        (variant) => variant.stripeProductID === stripeProductID,
      )

      if (variantIndex !== -1) {
        const variant = product.variants?.variants[variantIndex]

        const updatedInfo: Partial<InfoType> = {
          ...(typeof variant?.info === 'object' ? variant?.info : {}),
          price: {
            amount: price.unit_amount,
            currency: price.currency,
          },
          productName: stripeProductName,
        }

        const updatedVariants = product.variants?.variants.map((v, i) => {
          if (i === variantIndex) {
            return {
              ...v,
              info: updatedInfo,
            }
          }

          return v
        })

        if (payloadProductID) {
          await payload.update({
            id: payloadProductID,
            collection: 'products',
            data: {
              skipSync: true,
              variants: {
                variants: updatedVariants,
              },
            },
            req,
          })
        }
      }
    } else {
      if (payloadProductID && price && price.unit_amount) {
        const updatedInfo: Partial<InfoType> = {
          ...(typeof product?.info === 'object' ? product?.info : {}),
          price: {
            amount: price.unit_amount,
            currency: price.currency,
          },
          productName: stripeProductName,
        }

        await payload.update({
          id: payloadProductID,
          collection: 'products',
          data: {
            info: updatedInfo,
            skipSync: true,
          },
          req,
        })
      }
    }

    if (logs) payload.logger.info(`✅ Successfully updated product.`)
  } catch (error: unknown) {
    payload.logger.error(`- Error updating product: ${error}`)
  }
}

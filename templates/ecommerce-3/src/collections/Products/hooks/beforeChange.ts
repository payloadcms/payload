import type { InfoType } from '@/collections/Products/ui/types'
import type { Product } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'

import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' })

const logs = false

export const beforeProductChange: CollectionBeforeChangeHook<Product> = async ({ data, req }) => {
  const { payload } = req
  const newDoc: Record<string, unknown> = {
    ...data,
    skipSync: false, // Set back to 'false' so that all changes continue to sync to Stripe
  }

  if (data.skipSync) {
    if (logs) payload.logger.info(`Skipping product 'beforeChange' hook`)
    return newDoc
  }

  try {
    let price
    let currency

    if (data.enableVariants && data.variants?.variants?.length) {
      const variantsOrderedByPrice = data.variants?.variants?.sort((a, b) => {
        const aInfo = a?.info as InfoType
        const bInfo = b?.info as InfoType
        return aInfo?.price?.amount - bInfo?.price?.amount
      })
      price = (variantsOrderedByPrice[0].info as InfoType)?.price?.amount
      currency = (variantsOrderedByPrice[0].info as InfoType)?.price?.currency
    } else if ((data.info as InfoType)?.price?.amount) {
      price = (data.info as InfoType)?.price?.amount
      currency = (data.info as InfoType)?.price?.currency
    }

    newDoc.price = price
    newDoc.currency = currency
  } catch (error: unknown) {
    payload.logger.error(`Error fetching prices from Stripe: ${String(error)}`)
  }

  return newDoc
}

import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload/types'

import { APIError } from 'payload/errors'
import Stripe from 'stripe'

import type { StripeConfig } from '../types'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2022-08-01' })

type HookArgsWithCustomCollection = Omit<Parameters<CollectionAfterDeleteHook>[0], 'collection'> & {
  collection: CollectionConfig
}

export type CollectionAfterDeleteHookWithArgs = (
  args: HookArgsWithCustomCollection & {
    collection?: CollectionConfig
    stripeConfig?: StripeConfig
  },
) => void

export const deleteFromStripe: CollectionAfterDeleteHookWithArgs = async (args) => {
  const { collection, doc, req, stripeConfig } = args

  const { logs, sync } = stripeConfig || {}

  const { payload } = req
  const { slug: collectionSlug } = collection || {}

  if (logs)
    payload.logger.info(
      `Document with ID: '${doc?.id}' in collection: '${collectionSlug}' has been deleted, deleting from Stripe...`,
    )

  if (process.env.NODE_ENV !== 'test') {
    if (logs) payload.logger.info(`- Deleting Stripe document with ID: '${doc.stripeID}'...`)

    const syncConfig = sync?.find((conf) => conf.collection === collectionSlug)

    if (syncConfig) {
      try {
        const found = await stripe?.[syncConfig.stripeResourceType]?.retrieve(doc.stripeID)

        if (found) {
          await stripe?.[syncConfig.stripeResourceType]?.del(doc.stripeID)
          if (logs)
            payload.logger.info(
              `✅ Successfully deleted Stripe document with ID: '${doc.stripeID}'.`,
            )
        } else {
          if (logs)
            payload.logger.info(
              `- Stripe document with ID: '${doc.stripeID}' not found, skipping...`,
            )
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : error
        throw new APIError(`Failed to delete Stripe document with ID: '${doc.stripeID}': ${msg}`)
      }
    }
  }
}

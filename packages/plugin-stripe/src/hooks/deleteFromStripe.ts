import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload'

import { APIError } from 'payload'
import Stripe from 'stripe'

import type { StripePluginConfig } from '../types.js'

type HookArgsWithCustomCollection = {
  collection: CollectionConfig
} & Omit<Parameters<CollectionAfterDeleteHook>[0], 'collection'>

export type CollectionAfterDeleteHookWithArgs = (
  args: {
    collection?: CollectionConfig
    pluginConfig?: StripePluginConfig
  } & HookArgsWithCustomCollection,
) => Promise<void>

export const deleteFromStripe: CollectionAfterDeleteHookWithArgs = async (args) => {
  const { collection, doc, pluginConfig, req } = args

  const { logs, sync } = pluginConfig || {}

  const { payload } = req
  const { slug: collectionSlug } = collection || {}

  if (logs) {
    payload.logger.info(
      `Document with ID: '${doc?.id}' in collection: '${collectionSlug}' has been deleted, deleting from Stripe...`,
    )
  }

  if (process.env.NODE_ENV !== 'test') {
    if (logs) {
      payload.logger.info(`- Deleting Stripe document with ID: '${doc.stripeID}'...`)
    }

    const syncConfig = sync?.find((conf) => conf.collection === collectionSlug)

    if (syncConfig) {
      try {
        // api version can only be the latest, stripe recommends ts ignoring it
        const stripe = new Stripe(pluginConfig.stripeSecretKey || '', { apiVersion: '2022-08-01' })

        const found = await stripe?.[syncConfig.stripeResourceType]?.retrieve(doc.stripeID)

        if (found) {
          await stripe?.[syncConfig.stripeResourceType]?.del(doc.stripeID)
          if (logs) {
            payload.logger.info(
              `✅ Successfully deleted Stripe document with ID: '${doc.stripeID}'.`,
            )
          }
        } else {
          if (logs) {
            payload.logger.info(
              `- Stripe document with ID: '${doc.stripeID}' not found, skipping...`,
            )
          }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : error
        throw new APIError(`Failed to delete Stripe document with ID: '${doc.stripeID}': ${msg}`)
      }
    }
  }
}

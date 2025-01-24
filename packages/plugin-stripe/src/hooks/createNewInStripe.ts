import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { APIError } from 'payload'
import Stripe from 'stripe'

import type { StripePluginConfig } from '../types.js'

import { deepen } from '../utilities/deepen.js'

type HookArgsWithCustomCollection = {
  collection: CollectionConfig
} & Omit<Parameters<CollectionBeforeValidateHook>[0], 'collection'>

export type CollectionBeforeValidateHookWithArgs = (
  args: {
    collection?: CollectionConfig
    pluginConfig?: StripePluginConfig
  } & HookArgsWithCustomCollection,
) => Promise<Partial<any>>

export const createNewInStripe: CollectionBeforeValidateHookWithArgs = async (args) => {
  const { collection, data, operation, pluginConfig, req } = args

  const { logs, sync } = pluginConfig || {}

  const payload = req?.payload

  const dataRef = data || {}

  if (process.env.NODE_ENV === 'test') {
    dataRef.stripeID = 'test'
    return dataRef
  }

  if (payload) {
    if (data?.skipSync) {
      if (logs) {
        payload.logger.info(`Bypassing collection-level hooks.`)
      }
    } else {
      // initialize as 'false' so that all Payload admin events sync to Stripe
      // then conditionally set to 'true' to for events that originate from webhooks
      // this will prevent webhook events from triggering an unnecessary sync / infinite loop
      dataRef.skipSync = false

      const { slug: collectionSlug } = collection || {}
      const syncConfig = sync?.find((conf) => conf.collection === collectionSlug)

      if (syncConfig) {
        // combine all fields of this object and match their respective values within the document
        let syncedFields = syncConfig.fields.reduce(
          (acc, field) => {
            const { fieldPath, stripeProperty } = field

            acc[stripeProperty] = dataRef[fieldPath]
            return acc
          },
          {} as Record<string, any>,
        )

        syncedFields = deepen(syncedFields)

        // api version can only be the latest, stripe recommends ts ignoring it
        const stripe = new Stripe(pluginConfig.stripeSecretKey || '', { apiVersion: '2022-08-01' })

        if (operation === 'update') {
          if (logs) {
            payload.logger.info(
              `A '${collectionSlug}' document has changed in Payload with ID: '${data?.id}', syncing with Stripe...`,
            )
          }

          // NOTE: the Stripe document will be created in the "afterChange" hook, so create a new stripe document here if no stripeID exists
          if (!dataRef.stripeID) {
            try {
              // NOTE: Typed as "any" because the "create" method is not standard across all Stripe resources
              const stripeResource = await stripe?.[syncConfig.stripeResourceType]?.create(
                // @ts-expect-error
                syncedFields,
              )

              if (logs) {
                payload.logger.info(
                  `✅ Successfully created new '${syncConfig.stripeResourceType}' resource in Stripe with ID: '${stripeResource.id}'.`,
                )
              }

              dataRef.stripeID = stripeResource.id

              // NOTE: this is to prevent sync in the "afterChange" hook
              dataRef.skipSync = true
            } catch (error: unknown) {
              const msg = error instanceof Error ? error.message : error
              if (logs) {
                payload.logger.error(`- Error creating Stripe document: ${msg}`)
              }
            }
          }
        }

        if (operation === 'create') {
          if (logs) {
            payload.logger.info(
              `A new '${collectionSlug}' document was created in Payload with ID: '${data?.id}', syncing with Stripe...`,
            )
          }

          try {
            if (logs) {
              payload.logger.info(
                `- Creating new '${syncConfig.stripeResourceType}' resource in Stripe...`,
              )
            }

            // NOTE: Typed as "any" because the "create" method is not standard across all Stripe resources
            const stripeResource = await stripe?.[syncConfig.stripeResourceType]?.create(
              // @ts-expect-error
              syncedFields,
            )

            if (logs) {
              payload.logger.info(
                `✅ Successfully created new '${syncConfig.stripeResourceType}' resource in Stripe with ID: '${stripeResource.id}'.`,
              )
            }

            dataRef.stripeID = stripeResource.id

            // IMPORTANT: this is to prevent sync in the "afterChange" hook
            dataRef.skipSync = true
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : error
            throw new APIError(
              `Failed to create new '${syncConfig.stripeResourceType}' resource in Stripe: ${msg}`,
            )
          }
        }
      }
    }
  }

  return dataRef
}

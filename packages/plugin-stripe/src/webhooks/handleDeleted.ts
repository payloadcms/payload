import type { SanitizedStripeConfig, StripeWebhookHandler } from '../types'

type HandleDeleted = (
  args: Parameters<StripeWebhookHandler>[0] & {
    resourceType: string
    syncConfig: SanitizedStripeConfig['sync'][0]
  },
) => void

export const handleDeleted: HandleDeleted = async (args) => {
  const { event, payload, resourceType, stripeConfig, syncConfig } = args

  const { logs } = stripeConfig || {}

  const collectionSlug = syncConfig?.collection

  const {
    id: stripeID,
    object: eventObject, // use this to determine if this is a nested field
  }: any = event?.data?.object || {}

  // if the event object and resource type don't match, this deletion was not top-level
  const isNestedDelete = eventObject !== resourceType

  if (isNestedDelete) {
    if (logs)
      payload.logger.info(
        `- This deletion occurred on a nested field of ${resourceType}. Nested fields are not yet supported.`,
      )
  }

  if (!isNestedDelete) {
    if (logs)
      payload.logger.info(
        `- A '${resourceType}' resource was deleted in Stripe, now deleting '${collectionSlug}' document in Payload with Stripe ID: '${stripeID}'...`,
      )

    try {
      const payloadQuery = await payload.find({
        collection: collectionSlug,
        where: {
          stripeID: {
            equals: stripeID,
          },
        },
      })

      const foundDoc = payloadQuery.docs[0] as any

      if (!foundDoc) {
        if (logs)
          payload.logger.info(
            `- Nothing to delete, no existing document found with Stripe ID: '${stripeID}'.`,
          )
      }

      if (foundDoc) {
        if (logs) payload.logger.info(`- Deleting Payload document with ID: '${foundDoc.id}'...`)

        try {
          payload.delete({
            id: foundDoc.id,
            collection: collectionSlug,
          })

          // NOTE: the `afterDelete` hook will trigger, which will attempt to delete the document from Stripe and safely error out
          // There is no known way of preventing this from happening. In other hooks we use the `skipSync` field, but here the document is already deleted.
          if (logs)
            payload.logger.info(
              `- ✅ Successfully deleted Payload document with ID: '${foundDoc.id}'.`,
            )
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : error
          if (logs) payload.logger.error(`Error deleting document: ${msg}`)
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : error
      if (logs) payload.logger.error(`Error deleting document: ${msg}`)
    }
  }
}

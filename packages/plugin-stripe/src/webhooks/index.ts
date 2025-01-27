import type { StripeWebhookHandler } from '../types'

import { handleCreatedOrUpdated } from './handleCreatedOrUpdated'
import { handleDeleted } from './handleDeleted'

export const handleWebhooks: StripeWebhookHandler = async (args) => {
  const { event, payload, stripeConfig } = args

  if (stripeConfig?.logs)
    payload.logger.info(`🪝 Received Stripe '${event.type}' webhook event with ID: '${event.id}'.`)

  // could also traverse into event.data.object.object to get the type, but that seems unreliable
  // use cli: `stripe resources` to see all available resources
  const resourceType = event.type.split('.')[0]
  const method = event.type.split('.').pop()

  const syncConfig = stripeConfig?.sync?.find(
    (sync) => sync.stripeResourceTypeSingular === resourceType,
  )

  if (syncConfig) {
    switch (method) {
      case 'created': {
        await handleCreatedOrUpdated({
          ...args,
          resourceType,
          stripeConfig,
          syncConfig,
        })
        break
      }
      case 'updated': {
        await handleCreatedOrUpdated({
          ...args,
          resourceType,
          stripeConfig,
          syncConfig,
        })
        break
      }
      case 'deleted': {
        await handleDeleted({
          ...args,
          resourceType,
          stripeConfig,
          syncConfig,
        })
        break
      }
      default: {
        break
      }
    }
  }
}

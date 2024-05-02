import type { StripeWebhookHandler } from '../types.js'

import { handleCreatedOrUpdated } from './handleCreatedOrUpdated.js'
import { handleDeleted } from './handleDeleted.js'

export const handleWebhooks: StripeWebhookHandler = (args) => {
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
        void handleCreatedOrUpdated({
          ...args,
          resourceType,
          stripeConfig,
          syncConfig,
        })
        break
      }
      case 'updated': {
        void handleCreatedOrUpdated({
          ...args,
          resourceType,
          stripeConfig,
          syncConfig,
        })
        break
      }
      case 'deleted': {
        void handleDeleted({
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

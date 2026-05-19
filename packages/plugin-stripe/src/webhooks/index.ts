import type { StripeWebhookHandler } from '../types.js'

import { handleCreatedOrUpdated } from './handleCreatedOrUpdated.js'
import { handleDeleted } from './handleDeleted.js'

export const handleWebhooks: StripeWebhookHandler = async (args) => {
  const { event, payload, pluginConfig } = args

  if (pluginConfig?.logs) {
    payload.logger.info(`🪝 Received Stripe '${event.type}' webhook event with ID: '${event.id}'.`)
  }

  // could also traverse into event.data.object.object to get the type, but that seems unreliable
  // use cli: `stripe resources` to see all available resources
  const resourceType = event.type.split('.')[0]
  const method = event.type.split('.').pop()

  const syncConfig = pluginConfig?.sync?.find(
    (sync) => sync.stripeResourceTypeSingular === resourceType,
  )

  if (syncConfig) {
    switch (method) {
      case 'created': {
        await handleCreatedOrUpdated({
          ...args,
          pluginConfig,
          resourceType,
          syncConfig,
        })
        break
      }
      case 'deleted': {
        await handleDeleted({
          ...args,
          pluginConfig,
          resourceType,
          syncConfig,
        })
        break
      }
      case 'updated': {
        await handleCreatedOrUpdated({
          ...args,
          pluginConfig,
          resourceType,
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

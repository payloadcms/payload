import { StripeWebhookHandler } from '../types';
import { handleCreatedOrUpdated } from './handleCreatedOrUpdated';
import { handleDeleted } from './handleDeleted';

export const handleWebhooks: StripeWebhookHandler = async (args) => {
  const {
    payload,
    event,
    stripeConfig
  } = args;

  payload.logger.info(`Processing Stripe '${event.type}' webhook event with ID: '${event.id}'.`);

  // could also traverse into event.data.object.object to get the type, but that seems unreliable
  const objectType = event.type.split('.')[0];

  const syncConfig = stripeConfig?.sync?.find((sync) => sync.objectSingular === objectType);

  if (syncConfig) {
    switch (event.type) {
      case `${objectType}.created`: {
        await handleCreatedOrUpdated({
          ...args,
          syncConfig,
        });
        break;
      }
      case `${objectType}.updated`: {
        await handleCreatedOrUpdated({
          ...args,
          syncConfig
        });
        break;
      }
      case `${objectType}.deleted`: {
        await handleDeleted({
          ...args,
          syncConfig
        });
        break;
      }
      default: {
        break;
      }
    }
  }
};

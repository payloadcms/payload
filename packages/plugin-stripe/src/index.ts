import { Config } from 'payload/config';
import { stripeREST } from './routes/rest';
import { stripeWebhooks } from './routes/webhooks';
import { StripeConfig } from './types';

export { stripeProxy } from './utilities/stripeProxy';

const stripe = (stripeConfig: StripeConfig) => (config: Config): Config => {
  return ({
    ...config,
    endpoints: [
      ...config?.endpoints || [],
      {
        path: '/stripe/webhooks',
        method: 'post',
        handler: (req, res, next) => {
          stripeWebhooks(req, res, next, stripeConfig)
        }
      },
      {
        path: '/stripe/rest',
        method: 'post',
        handler: (req, res, next) => {
          stripeREST(req, res, next, stripeConfig)
        }
      },
    ]
  })
};

export default stripe;

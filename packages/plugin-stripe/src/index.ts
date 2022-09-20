import { Config } from 'payload/config';
import { stripeREST } from './routes/rest';
import { stripeWebhooks } from './routes/webhooks';
import { StripeConfig } from './types';
import { extendWebpackConfig } from './extendWebpackConfig';

const stripePlugin = (stripeConfig: StripeConfig) => (config: Config): Config => {
  return ({
    ...config,
    admin: {
      ...config.admin,
      webpack: extendWebpackConfig(config),
    },
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

export default stripePlugin;

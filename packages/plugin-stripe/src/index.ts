import { Response } from 'express';
import { Config } from 'payload/config';
import { PayloadRequest } from 'payload/dist/types';
import { stripeREST } from './routes/rest';
import { stripeWebhooks } from './routes/webhooks';
import { StripeConfig } from './types';

const stripe = (stripeConfig: StripeConfig) => (config: Config): Config => {
  return ({
    ...config,
    endpoints: [
      ...config?.endpoints || [],
      {
        path: '/stripe/webhooks',
        method: 'post',
        handler: (req: PayloadRequest, res: Response, next: any) => {
          stripeWebhooks(req, res, next, stripeConfig)
        }
      },
      {
        path: '/stripe/rest',
        method: 'post',
        handler: (req: PayloadRequest, res: Response, next: any) => {
          stripeREST(req, res, next, stripeConfig)
        }
      },
    ]
  })
};

export default stripe;

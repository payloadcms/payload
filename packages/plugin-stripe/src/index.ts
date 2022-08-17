import { Config } from 'payload/config';
import { getAllProducts } from './routes/getAllProducts';
import { getStripeSubscriptions } from './routes/getSubscriptions';
import { updateStripePayment } from './routes/updatePayment';
import webhooks from './routes/webhooks';
import { StripeConfig } from './types';

const stripe = (stripeConfig: StripeConfig) => (config: Config): Config => {
  return ({
    ...config,
    // endpoints: [
    //   ...config?.endpoints || [],
    //   {
    //     path: '/stripe/webhooks',
    //     method: 'post',
    //     handler: (req, res) => {
    //       webhooks(req, res, stripeConfig)
    //     }
    //   },
    //   {
    //     path: '/stripe/subscriptions/update-payment',
    //     method: 'post',
    //     handler: (req, res) => {
    //       updateStripePayment(req, res, stripeConfig)
    //     }
    //   },
    //   {
    //     path: '/stripe/subscriptions/:id',
    //     method: 'get',
    //     handler: (req, res) => {
    //       getStripeSubscriptions(req, res, stripeConfig)
    //     }
    //   },
    //   {
    //     path: '/stripe/products',
    //     method: 'get',
    //     handler: (req, res) => {
    //       getAllProducts(req, res, stripeConfig)
    //     }
    //   },
    // ]
  })
};

export default stripe;

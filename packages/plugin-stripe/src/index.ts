import { Config } from 'payload/config';
import { StripeConfig } from './types';

const stripe = (stripeConfig: StripeConfig) => (config: Config): Config => {
  return ({
    ...config,
    ...stripeConfig || {}
  })
};

export default stripe;

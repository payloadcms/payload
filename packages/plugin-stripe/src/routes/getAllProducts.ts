import payload from 'payload';
import { PayloadRequest } from 'payload/dist/types';
import { Forbidden } from 'payload/errors';
import Stripe from 'stripe';
import { StripeConfig } from '../types';

export const getAllProducts = async (
  req: PayloadRequest,
  res: any,
  next: any,
  stripeConfig: StripeConfig
) => {
  const { stripeSecretKey } = stripeConfig;

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' });

  try {
    const { user } = req;

    if (!user) {
      throw new Forbidden();
    }

    const products = await stripe.products.list(({
      limit: 20,
    }));

    if (!products?.data) {
      return res.status(404);
    }

    return res.json({
      products
    });
  } catch (err) {
    return next(err);
  }
};

import { PayloadRequest } from 'payload/types';
import { Forbidden } from 'payload/errors';
import Stripe from 'stripe';
import { StripeConfig } from '../types';
import lodashGet from 'lodash.get';
import { Response } from 'express';

export const stripeREST = async (
  req: PayloadRequest,
  res: Response,
  next: any,
  stripeConfig: StripeConfig
) => {
  const { payload } = req;
  const { stripeSecretKey } = stripeConfig;

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' });

  try {
    const {
      body: {
        stripeMethod, // example: 'subscriptions.list',
        stripeArgs // example: 'cus_MGgt3Tuj3D66f2'
      },
      user
    } = req;

    if (!user) { // TODO: make this customizable from the config
      throw new Forbidden();
    }

    if (typeof stripeMethod === 'string') {
      const topLevelMethod = stripeMethod.split('.')[0] as keyof Stripe;
      const contextToBind = stripe[topLevelMethod];
      const foundMethod = lodashGet(stripe, stripeMethod).bind(contextToBind); // NOTE: 'lodashGet' uses dot notation and finds the property on the object

      if (typeof foundMethod === 'function') {
        try {
          const stripeResponse = await foundMethod(stripeArgs);
          return res.json(stripeResponse);
        } catch (error) {
          return res.status(404).send(`A Stripe API error has occurred: ${error}`);
        }
      } else {
        payload.logger.error(`The provided Stripe method of '${stripeMethod}' is not a part of the Stripe API.`)
        return next();
      }
    } else {
      payload.logger.error('You must provide a Stripe method to call.')
      return next();
    }

  } catch (err) {
    return next(err);
  }
};

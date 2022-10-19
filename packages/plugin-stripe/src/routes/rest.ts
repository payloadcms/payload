import { PayloadRequest } from 'payload/types';
import { Forbidden } from 'payload/errors';
import { StripeConfig } from '../types';
import { Response } from 'express';
import { stripeProxy } from '../utilities/stripeProxy';

export const stripeREST = async (args: {
  req: PayloadRequest,
  res: Response,
  next: any,
  stripeConfig: StripeConfig
}) => {
  const {
    req,
    res,
    next,
    stripeConfig
  } = args;

  const {
    payload,
    user,
    body: {
      stripeMethod, // example: 'subscriptions.list',
      stripeArgs // example: ['cus_MGgt3Tuj3D66f2'] or [{ limit: 100 }, { stripeAccount: 'acct_1J9Z4pKZ4Z4Z4Z4Z' }]
    },
  } = req;

  const { stripeSecretKey } = stripeConfig;

  try {
    if (!user) { // TODO: make this customizable from the config
      throw new Forbidden();
    }

    const pluginRes = await stripeProxy({
      stripeSecretKey,
      stripeMethod,
      stripeArgs
    });

    const {
      status,
    } = pluginRes;

    res.status(status).json(pluginRes);

  } catch (error) {
    const message = `An error has occurred in the Stripe plugin REST handler: '${error}'`;
    payload.logger.error(message);
    return res.status(500).json({
      message
    });
  }
};

import payload from 'payload';
import { PayloadRequest } from 'payload/dist/types';
import { Forbidden } from 'payload/errors';
import Stripe from 'stripe';
import { StripeConfig } from '../types';

export const updateStripePayment = async (
  req: PayloadRequest,
  res: any,
  next: any,
  stripeConfig: StripeConfig
) => {
  const { stripeSecretKey } = stripeConfig;

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' });

  try {
    const { body: { subscriptionID, paymentMethodID }, user } = req;

    if (!user) {
      throw new Forbidden();
    }

    await stripe.paymentMethods.attach(paymentMethodID, {
      customer: user.stripeCustomerID as string, // TODO: remove type assertion
    });

    await stripe.subscriptions.update(subscriptionID, {
      default_payment_method: paymentMethodID,
    });

    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
};

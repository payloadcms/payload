import payload from 'payload';
import { PayloadRequest } from 'payload/dist/types';
import { Forbidden } from 'payload/errors';
import Stripe from 'stripe';
import { StripeConfig } from '../types';

export const getStripeSubscriptions = async (
  req: PayloadRequest,
  res: any,
  next: any,
  stripeConfig: StripeConfig
) => {
  const { stripeSecretKey } = stripeConfig;

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' });

  try {
    const { params: { id }, user } = req;

    if (!user) {
      throw new Forbidden();
    }

    const subscription = await stripe.subscriptions.retrieve(id);

    if (!subscription?.items?.data?.[0]?.plan?.id) {
      return res.status(404);
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(subscription.default_payment_method as string);

    const invoices = await stripe.invoices.list({
      subscription: id,
      limit: 20,
    });

    return res.json({
      paymentMethod: {
        brand: paymentMethod?.card?.brand,
        last4: paymentMethod?.card?.last4,
      },
      invoices: invoices.data.map(({ amount_due: amount, created }) => ({
        amount,
        created,
      })),
    });
  } catch (err) {
    return next(err);
  }
};

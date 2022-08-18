import Stripe from 'stripe';
import { PayloadRequest } from 'payload/dist/types';
import { StripeConfig } from '../types';

export const stripeWebhooks = (
  req: PayloadRequest,
  res: any,
  next: any,
  stripeConfig: StripeConfig
) => {
  const {
    stripeSecretKey,
    stripeWebhookEndpointSecret,
    webhooks
  } = stripeConfig;

  if (webhooks && stripeWebhookEndpointSecret) {
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' });

    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event | undefined;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookEndpointSecret);
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event) {
      const webhookEventHandler = webhooks[event.type];
      if (typeof webhookEventHandler === 'function') {
        webhookEventHandler(event, stripe, stripeConfig)
      };
    }
  }

  res.json({ received: true });
};

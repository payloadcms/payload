import express from 'express';
import payload from 'payload';
// import authenticate 'payload/dist/express/middleware/authenticate';
import Stripe from 'stripe';
import { handleWebhooks } from '../../src/webhooks/handleWebhooks';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-08-01',
});

require('dotenv').config();
const app = express();

// Redirect root to Admin panels
app.get('/', (_, res) => {
  res.redirect('/admin');
});

// Initialize Payload
payload.init({
  secret: process.env.PAYLOAD_SECRET,
  mongoURL: process.env.MONGODB_URI,
  express: app,
  onInit: () => {
    payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
  },
});

// Add your own express routes here

// TODO: instead of opening this custom route, use the 'root: true' on an endpoint in the Payload config, when released
// app.post('/stripe/webhooks', [
//   express.raw({ type: 'application/json' }),
//   async (req: express.Request, res: express.Response): Promise<void> => {
//     const stripeSignature = req.headers['stripe-signature'];

//     let event: Stripe.Event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, stripeSignature, process.env.STRIPE_WEBHOOKS_ENDPOINT_SECRET);
//       await handleWebhooks(payload, event, stripe);
//     } catch (err) {
//       console.error(`Webhook Error: ${err.message}`);
//       res.status(400);
//       return;
//     }

//     res.json({ received: true });
//   },
// ]);

app.listen(3000);

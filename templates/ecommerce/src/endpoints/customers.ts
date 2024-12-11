import type { PayloadHandler, PayloadRequest } from 'payload'

import Stripe from 'stripe'

import { checkRole } from '@/access/checkRole'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
})

const logs = process.env.LOGS_STRIPE_PROXY === '1'

// use this handler to get all Stripe customers
// prevents unauthorized or non-admin users from accessing all Stripe customers
// GET /api/customers
export const customersProxy: PayloadHandler = async (req: PayloadRequest) => {
  if (!req.user || !checkRole(['admin'], req.user)) {
    if (logs) req.payload.logger.error({ err: `You are not authorized to access customers` })

    return Response.json({ error: 'You are not authorized to access customers' }, { status: 401 })
  }

  try {
    const customers = await stripe.customers.list({
      limit: 100,
    })

    return Response.json(customers, { status: 200 })
  } catch (error: unknown) {
    if (logs) req.payload.logger.error({ err: `Error using Stripe API: ${String(error)}` })

    return Response.json({ error: `Error using Stripe API: ${String(error)}` }, { status: 500 })
  }
}

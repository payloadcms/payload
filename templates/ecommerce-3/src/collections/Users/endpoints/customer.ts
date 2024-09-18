import type { PayloadHandler } from 'payload'
import type { PayloadRequest } from 'payload'

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
})

const logs = process.env.LOGS_STRIPE_PROXY === '1'

// use this handler to interact with a Stripe customer associated with any given user
// does so in secure way that does not leak or expose any cross-customer data
// pass the proper method and body to this endpoint to interact with the Stripe API
// available methods:
// GET /api/users/:id/customer
// POST /api/users/:id/customer
// body: { customer: Stripe.CustomerUpdateParams }
export const customerProxy: PayloadHandler = async (req: PayloadRequest) => {
  const userID: string = req?.routeParams?.userID as string

  if (!req.user) {
    if (logs) req.payload.logger.error({ err: `You are not authorized to access this customer` })

    return Response.json(
      { error: 'You are not authorized to access this customer' },
      { status: 401 },
    )
  }

  if (!req.user?.stripeCustomerID) {
    const message = `No stripeCustomerID found for user ${userID}`
    if (logs) req.payload.logger.error({ err: message })

    return Response.json({ error: message }, { status: 401 })
  }

  try {
    let response:
      | Array<Stripe.Customer | Stripe.DeletedCustomer>
      | Stripe.ApiList<Stripe.Customer | Stripe.DeletedCustomer>
      | Stripe.Customer
      | Stripe.DeletedCustomer
      | null = null

    let customer: Stripe.Customer | Stripe.DeletedCustomer | null = null

    if (req.user.stripeCustomerID) {
      // look up the customer to ensure that it belongs to the user
      // this will ensure that this user is allows perform operations on it
      customer = await stripe.customers.retrieve(req.user.stripeCustomerID, {
        expand: ['invoice_settings.default_payment_method'],
      })

      if (customer.deleted) {
        return Response.json(
          { error: `Customer ${req.user.stripeCustomerID} not found` },
          { status: 404 },
        )
      }

      // ensure the customer belongs to the user
      if (customer.id !== req.user.stripeCustomerID) {
        return Response.json(
          { error: `You are not authorized to access this customer` },
          { status: 401 },
        )
      }
    }

    if (req.method === 'GET') {
      if (req.user.stripeCustomerID && customer) {
        response = customer
      }
    }

    if (req.method === 'PATCH') {
      if (!req.body) throw new Error('No customer data provided')
      // TODO: lock down the spread `customer` object to only allow certain fields
      // @ts-expect-error
      response = await stripe.customers.update(req.user.stripeCustomerID, req.body)
    }

    return Response.json(response, { status: 200 })
  } catch (error: unknown) {
    if (logs) req.payload.logger.error({ err: `Error using Stripe API: ${String(error)}` })

    return Response.json({ error: `Error using Stripe API.` }, { status: 500 })
  }
}

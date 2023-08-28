import type { PayloadHandler } from 'payload/config'
import type { PayloadRequest } from 'payload/types'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
export const customerProxy: PayloadHandler = async (req: PayloadRequest, res) => {
  const { userID } = req.params

  if (!req.user) {
    if (logs) req.payload.logger.error({ err: `You are not authorized to access this customer` })
    res.status(401).json({ error: 'You are not authorized to access this customer' })
    return
  }

  if (!req.user?.stripeCustomerID) {
    const message = `No stripeCustomerID found for user ${userID}`
    if (logs) req.payload.logger.error({ err: message })
    res.status(401).json({ error: message })
    return
  }

  try {
    let response:
      | Stripe.Customer
      | Stripe.DeletedCustomer
      | Array<Stripe.Customer | Stripe.DeletedCustomer>
      | Stripe.ApiList<Stripe.Customer | Stripe.DeletedCustomer>

    let customer: Stripe.Customer | Stripe.DeletedCustomer | null = null

    if (req.user.stripeCustomerID) {
      // look up the customer to ensure that it belongs to the user
      // this will ensure that this user is allows perform operations on it
      customer = await stripe.customers.retrieve(req.user.stripeCustomerID, {
        expand: ['invoice_settings.default_payment_method'],
      })

      if (customer.deleted) {
        res.status(404).json({ error: `Customer ${req.user.stripeCustomerID} not found` })
        return
      }

      // ensure the customer belongs to the user
      if (customer.id !== req.user.stripeCustomerID) {
        res.status(401).json({ error: `You are not authorized to access this customer` })
        return
      }
    }

    if (req.method === 'GET') {
      if (req.user.stripeCustomerID) {
        response = customer
      }
    }

    if (req.method === 'PATCH') {
      if (!req.body) throw new Error('No customer data provided')
      // TODO: lock down the spread `customer` object to only allow certain fields
      response = await stripe.customers.update(req.user.stripeCustomerID, req.body)
    }

    res.status(200).json(response)
  } catch (error: unknown) {
    if (logs) req.payload.logger.error({ err: `Error using Stripe API: ${error}` })
    res.status(500).json({ error: `Error using Stripe API: ${error}` })
  }
}

import type { PayloadHandler } from 'payload/config'
import Stripe from 'stripe'

import type { User } from '../payload-types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})

// This endpoint creates a PaymentIntent with the items in the cart using the "Invoices" API
// This is required in order to associate each line item with its respective product in Stripe
// To do this, we loop through the items in the cart and create a line-item in the invoice for each cart item
// Once completed, we pass the `client_secret` of the PaymentIntent back to the client which can process the payment
export const checkout: PayloadHandler = async (req, res): Promise<void> => {
  const { user, payload } = req

  const fullUser = await payload.findByID({
    collection: 'users',
    id: user?.id,
  })

  if (!fullUser) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  try {
    let stripeCustomerID = fullUser?.stripeCustomerID

    // lookup user in Stripe and create one if not found
    if (!stripeCustomerID) {
      const customer = await stripe.customers.create({
        email: fullUser?.email,
        name: fullUser?.name,
      })
      stripeCustomerID = customer.id
    }

    // initialize an empty invoice for the customer
    // the invoice will be charged automatically when it is sent
    // because the customer  has a payment method on record
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerID,
      collection_method: 'send_invoice',
      days_until_due: 30,
    })

    const hasItems = fullUser?.cart?.items?.length > 0

    if (!hasItems) {
      throw new Error('No items in cart')
    }

    // for each item in cart, create an invoice item and send the invoice
    await Promise.all(
      fullUser?.cart?.items?.map(
        async (item: User['cart']['items'][0]): Promise<Stripe.InvoiceItem> => {
          const { product } = item

          if (typeof product === 'string' || !product.stripeProductID) {
            throw new Error('No Stripe Product ID')
          }

          const prices = await stripe.prices.list({
            product: product.stripeProductID,
            limit: 100,
            expand: ['data.product'],
          })

          if (prices.data.length === 0) {
            res.status(404).json({ error: 'There are no items in your cart to checkout with' })
            return null
          }

          const price = prices.data[0]

          // price.type === 'recurring' is a subscription, which uses the Subscriptions API
          // that is out of scope for this boilerplate
          if (price.type === 'one_time') {
            return stripe.invoiceItems.create({
              customer: stripeCustomerID,
              price: price.id,
              invoice: invoice.id,
            })
          }

          return null
        },
      ),
    )

    // send the invoice to Stripe
    const finalInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

    // retrieve the payment intent from the invoice
    const paymentIntent = await stripe.paymentIntents.retrieve(
      typeof finalInvoice.payment_intent === 'string'
        ? finalInvoice.payment_intent
        : finalInvoice.payment_intent.id,
    )

    // return the `client_secret` of the payment intent to the client
    res.send({ client_secret: paymentIntent.client_secret })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(message)
    res.json({ error: message })
  }
}

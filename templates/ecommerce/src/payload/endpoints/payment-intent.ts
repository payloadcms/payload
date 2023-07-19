import type { PayloadHandler } from 'payload/config'
import Stripe from 'stripe'

import type { CartItems } from '../payload-types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-08-01',
})

// this endpoint creates a `PaymentIntent` with the items in the cart using the `Invoices API`
// this is required in order to associate each line item with its respective product in Stripe
// to do this, we loop through the items in the cart and create a line-item in the invoice for each cart item
// once completed, we pass the `client_secret` of the `PaymentIntent` back to the client which can process the payment
export const createPaymentIntent: PayloadHandler = async (req, res): Promise<void> => {
  const { user, payload } = req

  if (!user) {
    res.status(401).send('Unauthorized')
    return
  }

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

    // initialize an draft invoice for the customer, then add items to it
    // set `auto_advance` to false so that Stripe doesn't attempt to charge the customer
    // this will prevent Stripe setting to "open" after 1 hour and sending emails to the customer
    // the invoice will get finalized when upon payment via the `payment_intent` attached to the invoice below
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerID,
      collection_method: 'send_invoice',
      days_until_due: 30,
      auto_advance: false,
    })

    const hasItems = fullUser?.cart?.items?.length > 0

    if (!hasItems) {
      throw new Error('No items in cart')
    }

    // for each item in cart, create an invoice item and send the invoice
    await Promise.all(
      fullUser?.cart?.items?.map(async (item: CartItems[0]): Promise<Stripe.InvoiceItem | null> => {
        const { product } = item

        if (typeof product === 'string' || !product?.stripeProductID) {
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
        invoice.total += price.unit_amount

        // price.type === 'recurring' is a subscription, which uses the Subscriptions API
        // that is out of scope for this boilerplate
        if (price.type === 'one_time') {
          return stripe.invoiceItems.create({
            customer: stripeCustomerID,
            price: price.id,
            invoice: invoice.id,
            metadata: {
              payload_product_id: product.id,
            },
          })
        }

        return null
      }),
    )

    // need to create a `PaymentIntent` manually using the `Invoice` total
    // this is because the invoice is not set to `auto-advance` and we're not finalizing the invoice ourselves
    // instead, attach the `payment_intent` to the invoice and let Stripe finalize it when the payment is processed
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeCustomerID,
      amount: invoice.total,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        invoice_id: invoice.id,
      },
    })

    invoice.payment_intent = paymentIntent.id

    res.send({ client_secret: paymentIntent.client_secret })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(message)
    res.json({ error: message })
  }
}

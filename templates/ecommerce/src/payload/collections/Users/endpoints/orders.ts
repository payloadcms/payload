import type { PayloadHandler } from 'payload/config'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-08-01',
})

export const getUserOrders: PayloadHandler = async (req, res): Promise<void> => {
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

    if (!stripeCustomerID) {
      res.status(404).json({ error: 'User does not have a Stripe Customer ID' })
      return
    }

    const orders = await stripe.invoices.list({
      customer: stripeCustomerID,
      limit: 100,
      // only paid, active invoices
      // this is because we technically create a _potential_ invoice for every order
      // these invoices are not paid until the user completes the  checkout process
      // they remain in the Stripe logs until they expire
      // TODO: find a way to avoid this
      status: 'paid',
    })

    if (!orders || orders.data.length === 0) {
      res.status(404).json({ error: 'No orders found' })
      return
    }

    res.json(orders.data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(message)
    res.json({ error: message })
  }
}

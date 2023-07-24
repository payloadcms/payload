import type { PayloadHandler } from 'payload/config'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-08-01',
})

export const getUserOrder: PayloadHandler = async (req, res): Promise<void> => {
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

  if (!req.params.id) {
    res.status(404).json({ error: 'No order ID provided' })
    return
  }

  try {
    let stripeCustomerID = fullUser?.stripeCustomerID

    if (!stripeCustomerID) {
      res.status(404).json({ error: 'User does not have a Stripe Customer ID' })
      return
    }

    const order = await stripe.invoices.retrieve(req.params.id)

    if (!order || order.status === 'draft') {
      res.status(404).json({ error: 'No order found' })
      return
    }

    res.json(order)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(message)
    res.json({ error: message })
  }
}

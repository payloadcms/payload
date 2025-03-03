import type { Product, User } from '@/payload-types'
import type { PayloadHandler } from 'payload'

import { addDataAndFileToRequest } from 'payload'
import Stripe from 'stripe'

import type { CartItems } from '@/payload-types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-08-01',
})

// this endpoint creates an `Invoice` with the items in the cart
// to do this, we loop through the items in the cart and lookup the product in Stripe
// we then add the price of the product to the total
// once completed, we pass the `client_secret` of the `PaymentIntent` back to the client which can process the payment
export const createPaymentIntent: PayloadHandler = async (req) => {
  const { payload, user } = req

  await addDataAndFileToRequest(req)

  const cartFromRequest = req.data?.cart
  const emailFromRequest = req.data?.email

  if (!user && !emailFromRequest) {
    return Response.json('A user or an email is required for this transaction.', { status: 401 })
  }

  let fullUser: User | undefined

  if (user) {
    fullUser = await payload.findByID({
      id: user?.id,
      collection: 'users',
    })
  }

  const cart = fullUser?.cart?.items || (cartFromRequest as { items: CartItems }).items

  if (!cart || cart.length === 0) {
    return Response.json(
      { error: 'Please provide a cart either directly or from the user.' },
      { status: 401 },
    )
  }

  try {
    let stripeCustomerID = fullUser?.stripeCustomerID
    let stripeCustomer: Stripe.Customer | undefined

    // If the user is logged in and has a Stripe Customer ID, use that
    if (fullUser) {
      if (!stripeCustomerID) {
        // lookup user in Stripe and create one if not found

        const customer = (
          await stripe.customers.list({
            email: fullUser.email,
          })
        ).data?.[0]

        // Create a new customer if one is not found
        if (!customer) {
          // lookup user in Stripe and create one if not found
          const customer = await stripe.customers.create({
            name: fullUser?.name || fullUser.email,
            email: fullUser.email,
          })

          stripeCustomerID = customer.id
        } else {
          stripeCustomerID = customer.id
        }

        if (user?.id)
          await payload.update({
            id: user.id,
            collection: 'users',
            data: {
              stripeCustomerID,
            },
          })
      }
      // Otherwise use the email from the request to lookup the user in Stripe
    } else {
      // lookup user in Stripe and create one if not found
      const customer = (
        await stripe.customers.list({
          email: emailFromRequest as string,
        })
      ).data?.[0]

      // Create a new customer if one is not found
      if (!customer) {
        const customer = await stripe.customers.create({
          email: emailFromRequest as string,
        })

        stripeCustomer = customer
        stripeCustomerID = customer.id
      } else {
        stripeCustomer = customer
        stripeCustomerID = customer.id
      }
    }

    let total = 0

    const metadata: any[] = []

    // for each item in cart, lookup the product in Stripe and add its price to the total
    await Promise.all(
      cart?.map(async (item) => {
        const { product, quantity, variant: variantFromItem } = item

        const isVariant = Boolean(variantFromItem)

        if (!quantity) {
          return null
        }

        if (!product || typeof product === 'string') {
          return null
        }

        let price = 0
        let variant: NonNullable<NonNullable<Product['variants']>['variants']>[number] | null = null

        if (isVariant) {
          const matchingVariant = product?.variants?.variants?.find(
            (item) => item.id === variantFromItem,
          )

          if (matchingVariant) {
            variant = matchingVariant
            price = matchingVariant.price || 0
          }
        } else {
          price = product.price || 0
        }

        metadata.push({
          product: product.title,
          productId: product?.id,
          quantity: quantity,
          variantId: variant?.id,
          variant: variant?.options.map((option) => option).join(', '),
        })

        total += price * quantity

        return null
      }),
    )

    if (total === 0) {
      throw new Error('There is nothing to pay for, add some items to your cart and try again.')
    }

    console.log({ metadata })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      customer: stripeCustomerID,
      metadata: {
        cart: JSON.stringify(metadata),
      },
      payment_method_types: ['card'],
    })

    return Response.json({ client_secret: paymentIntent.client_secret }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    payload.logger.error(message)

    return Response.json({ error: message }, { status: 401 })
  }
}

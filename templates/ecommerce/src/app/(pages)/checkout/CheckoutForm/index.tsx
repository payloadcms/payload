'use client'

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'
import React, { useCallback } from 'react'

import type { Order } from '../../../../payload/payload-types'

import { Button } from '../../../_components/Button'
import { Message } from '../../../_components/Message'
import { priceFromJSON } from '../../../_components/Price'
import { useCart } from '../../../_providers/Cart'
import classes from './index.module.scss'

export const CheckoutForm: React.FC<{}> = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = React.useState<null | string>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { cart, cartTotal } = useCart()

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setIsLoading(true)

      try {
        const { error: stripeError, paymentIntent } = await stripe?.confirmPayment({
          confirmParams: {
            return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order-confirmation`,
          },
          elements,
          redirect: 'if_required',
        })

        if (stripeError) {
          setError(stripeError.message)
          setIsLoading(false)
        }

        if (paymentIntent) {
          // Before redirecting to the order confirmation page, we need to create the order in Payload
          // Cannot clear the cart yet because if you clear the cart while in the checkout
          // you will be redirected to the `/cart` page before this redirect happens
          // Instead, we clear the cart in an `afterChange` hook on the `orders` collection in Payload
          try {
            const orderReq = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders`, {
              body: JSON.stringify({
                items: (cart?.items || [])?.map(({ product, quantity }) => ({
                  price:
                    typeof product === 'object'
                      ? priceFromJSON(product.priceJSON, 1, true)
                      : undefined,
                  product: typeof product === 'string' ? product : product.id,
                  quantity,
                })),
                stripePaymentIntentID: paymentIntent.id,
                total: cartTotal.raw,
              }),
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              method: 'POST',
            })

            if (!orderReq.ok) throw new Error(orderReq.statusText || 'Something went wrong.')

            const {
              doc,
              error: errorFromRes,
            }: {
              doc: Order
              error?: string
              message?: string
            } = await orderReq.json()

            if (errorFromRes) throw new Error(errorFromRes)

            router.push(`/order-confirmation?order_id=${doc.id}`)
          } catch (err) {
            // don't throw an error if the order was not created successfully
            // this is because payment _did_ in fact go through, and we don't want the user to pay twice
            console.error(err.message) // eslint-disable-line no-console
            router.push(`/order-confirmation?error=${encodeURIComponent(err.message)}`)
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong.'
        setError(`Error while submitting payment: ${msg}`)
        setIsLoading(false)
      }
    },
    [stripe, elements, router, cart, cartTotal],
  )

  return (
    <form className={classes.form} onSubmit={handleSubmit}>
      {error && <Message error={error} />}
      <PaymentElement />
      <div className={classes.actions}>
        <Button appearance="secondary" href="/cart" label="Back to cart" />
        <Button
          appearance="primary"
          disabled={!stripe || isLoading}
          label={isLoading ? 'Loading...' : 'Checkout'}
          type="submit"
        />
      </div>
    </form>
  )
}

export default CheckoutForm

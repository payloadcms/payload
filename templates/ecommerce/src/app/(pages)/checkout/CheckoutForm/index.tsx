'use client'

import React, { useCallback } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'

import { Button } from '../../../_components/Button'
import { useCart } from '../../../_providers/Cart'

import classes from './index.module.scss'

export const CheckoutForm: React.FC<{}> = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { cart } = useCart()

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()
      setIsLoading(true)

      try {
        const { error: stripeError, paymentIntent } = await stripe?.confirmPayment({
          elements: elements!,
          redirect: 'if_required',
          confirmParams: {
            return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order-confirmation?clear_cart=true`,
          },
        })

        if (stripeError) {
          setError(stripeError.message)
          setIsLoading(false)
        }

        if (paymentIntent) {
          // Before redirecting to the order confirmation page, we need to notify Payload
          // Cannot clear the cart yet because if you clear the cart while in the checkout
          // you will be redirected to the `/cart` page before this redirect happens
          // Instead, we clear the cart on the `/order-confirmation` page via the  `clear_cart` query param
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/purchases`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                purchases: (cart?.items || [])?.map(({ product }) =>
                  typeof product === 'string' ? product : product.id,
                ), // eslint-disable-line function-paren-newline
              }),
            })

            // Do not throw an error if the sync fails because their payment has technically gone through
            // Instead, silently fail and let the user know that their order was placed but we couldn't sync purchases
            // if (!purchasesReq.ok)  throw new Error(purchasesReq.statusText || 'Something went wrong.')
            // const purchasesRes = await purchasesReq.json()
            // if (purchasesRes.error)  throw new Error(purchasesRes.error)
            router.push(
              `/order-confirmation?payment_intent_client_secret=${paymentIntent.client_secret}&payment_intent=${paymentIntent.id}&clear_cart=true`,
            )
          } catch (err) {
            throw new Error(`Error syncing purchases: ${err.message}`)
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong.'
        setError(`Error while submitting payment: ${msg}`)
        setIsLoading(false)
      }
    },
    [stripe, elements, router, cart],
  )

  return (
    <form onSubmit={handleSubmit} className={classes.form}>
      {error && <div className={classes.error}>{error}</div>}
      <PaymentElement />
      <div className={classes.actions}>
        <Button label="Back to cart" onClick={() => router.push('/cart')} appearance="secondary" />
        <Button
          label={isLoading ? 'Loading...' : 'Checkout'}
          type="submit"
          appearance="primary"
          disabled={!stripe || isLoading}
        />
      </div>
    </form>
  )
}

export default CheckoutForm

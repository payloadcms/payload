import React, { useCallback } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

import { Button } from '../Button'

import classes from './index.module.scss'

export const CheckoutForm: React.FC<{}> = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()

      setIsLoading(true)

      try {
        const {
          error: stripeError,
          // paymentIntent,
        } = await stripe.confirmPayment({
          elements,
          // redirect: 'if_required',
          confirmParams: {
            return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order-confirmation?clear_cart=true`,
          },
        })

        if (stripeError) {
          setError(stripeError.message)
          setIsLoading(false)
        }

        // Alternatively, you could handle the redirect yourself if `redirect: 'if_required'` is set
        // but this doesn't work currently because if you clear the cart while in the checkout
        // you will be redirected to the cart page before this redirect happens
        // if (paymentIntent) {
        //   clearCart();
        //   Router.push(`/order-confirmation?payment_intent_client_secret=${paymentIntent.client_secret}`);
        // }
      } catch (err) {
        setError('Something went wrong.')
        setIsLoading(false)
      }
    },
    [stripe, elements],
  )

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className={classes.error}>{error}</div>}
      <PaymentElement />
      <Button
        className={classes.checkoutButton}
        label={isLoading ? 'Loading...' : 'Checkout'}
        type="submit"
        appearance="primary"
        disabled={!stripe || isLoading}
      />
    </form>
  )
}

export default CheckoutForm

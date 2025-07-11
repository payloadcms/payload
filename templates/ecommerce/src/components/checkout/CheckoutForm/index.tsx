'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'
import React, { useCallback } from 'react'
import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/react'

type Props = {
  customerEmail?: string
}

export const CheckoutForm: React.FC<Props> = ({ customerEmail }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = React.useState<null | string>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const { initiatePayment, confirmOrder } = usePayments()

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setIsLoading(true)

      if (stripe && elements) {
        try {
          const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            confirmParams: {
              return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm-order?email=${customerEmail}`,
            },
            elements,
            redirect: 'if_required',
          })

          if (paymentIntent && paymentIntent.status === 'succeeded') {
            const confirmResult = await confirmOrder('stripe', {
              additionalData: {
                paymentIntentID: paymentIntent.id,
                ...(customerEmail ? { customerEmail } : {}),
              },
            })

            if (
              confirmResult &&
              typeof confirmResult === 'object' &&
              'orderID' in confirmResult &&
              confirmResult.orderID
            ) {
              // Clear the cart after successful payment
              clearCart()
              // Redirect to order confirmation page
              router.push(`/orders/${confirmResult.orderID}?email=${customerEmail}`)
            }
          }
          if (stripeError?.message) {
            setError(stripeError.message)
            setIsLoading(false)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Something went wrong.'
          setError(`Error while submitting payment: ${msg}`)
          setIsLoading(false)
        }
      }
    },
    [stripe, elements, clearCart, router],
  )

  return (
    <form className="'" onSubmit={handleSubmit}>
      {error && <Message error={error} />}
      <PaymentElement />
      <div className="mt-8 flex gap-4">
        <Button disabled={!stripe || isLoading} type="submit" variant="default">
          {isLoading ? 'Loading...' : 'Pay now'}
        </Button>
      </div>
    </form>
  )
}

export default CheckoutForm

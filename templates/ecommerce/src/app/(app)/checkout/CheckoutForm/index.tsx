'use client'

import type { Order } from '@/payload-types'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { useCart } from '@/providers/Cart'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback } from 'react'

export const CheckoutForm: React.FC = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = React.useState<null | string>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { cart, cartTotal, clearCart } = useCart()

  function wait(delay = 500) {
    return new Promise((resolve) => setTimeout(resolve, delay))
  }

  const fetchRetry = useCallback(
    async (url: string, fetchOptions = {}, delay = 750, tries = 3): Promise<any> => {
      function onError(err) {
        const triesLeft = tries - 1
        if (!triesLeft) {
          throw err
        }
        return wait(delay).then(() => fetchRetry(url, fetchOptions, delay, triesLeft))
      }

      return fetch(url, fetchOptions).catch(onError)
    },
    [],
  )

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setIsLoading(true)

      if (stripe && elements) {
        try {
          const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            confirmParams: {
              return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order-confirmation`,
            },
            elements,
            redirect: 'if_required',
          })

          if (stripeError?.message) {
            setError(stripeError.message)
            setIsLoading(false)
          }

          if (paymentIntent?.id) {
            /**
             * We need to wait for an order to be created on the backend, so we try a few fetches
             * with a delay in between to give the server time to process the order
             */
            try {
              const query = new URLSearchParams()

              query.append('limit', '1')
              query.append('depth', '0')
              query.append('where', `[stripePaymentIntentID][equals]=${paymentIntent.id}`)

              const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders?${query.toString()}`

              setTimeout(() => {
                fetch(url, {
                  credentials: 'include',
                  method: 'GET',
                })
                  .then((res) => res.json())
                  .then((data) => {
                    console.log('received', data, 'for payment', paymentIntent)

                    const redirect = `/orders/${data.docs?.[0]?.id}?paymentId=${paymentIntent.id}`
                    clearCart()
                    router.push(redirect)
                  })
                  .catch((err) => {
                    throw new Error(err?.statusText || 'Something went wrong.')
                  })
              }, 3000)
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
      }
    },
    [stripe, elements, clearCart, router],
  )

  return (
    <form className="'" onSubmit={handleSubmit}>
      {error && <Message error={error} />}
      <PaymentElement />
      <div className="mt-8 flex gap-4">
        <Button asChild variant="outline">
          <Link href="/cart">Back to cart</Link>
        </Button>
        <Button disabled={!stripe || isLoading} type="submit" variant="default">
          {isLoading ? 'Loading...' : 'Pay now'}
        </Button>
      </div>
    </form>
  )
}

export default CheckoutForm

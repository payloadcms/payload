'use client'

import React, { useEffect, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useSearchParams } from 'next/navigation'

import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { useCart } from '../../_providers/Cart'

import classes from './index.module.scss'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripePromise = loadStripe(apiKey)

const OrderConfirmation: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const paymentIntent = searchParams.get('payment_intent')

  const { clearCart } = useCart()
  const hasRetrievedPaymentIntent = useRef(false)

  useEffect(() => {
    if (hasRetrievedPaymentIntent.current) return
    hasRetrievedPaymentIntent.current = true

    const doSomething = async () => {
      const stripe = await stripePromise

      if (!stripe) return

      const params = new URLSearchParams(window.location.search)
      const clientSecret = params.get('payment_intent_client_secret')
      const shouldClearCart = params.get('clear_cart')
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret || '')

      switch (paymentIntent?.status) {
        case 'succeeded':
          if (shouldClearCart) clearCart()
          setMessage('Success! Payment received.')
          break
        case 'processing':
          if (shouldClearCart) clearCart()
          setMessage("Payment processing. We'll update you when payment is received.")
          break
        case 'requires_payment_method':
          setMessage('Payment failed. Please try another payment method.')
          break
        default:
          setMessage('Something went wrong.')
          break
      }
    }

    doSomething()
  }, [clearCart])

  return (
    <Gutter className={classes.confirmationPage}>
      <h1>Order confirmed</h1>
      <p>
        {`Status: ${message}`}
        <br />
        {`Stripe Payment ID: ${paymentIntent}`}
      </p>
      <Button href="/orders" appearance="primary" label="View orders" />
    </Gutter>
  )
}

export default OrderConfirmation

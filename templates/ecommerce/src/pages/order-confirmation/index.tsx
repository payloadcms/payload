import React, { useEffect, useRef, useState } from 'react'
import { gql } from '@apollo/client'
import { loadStripe } from '@stripe/stripe-js'
import { GetStaticProps } from 'next'
import { useRouter } from 'next/router'

import { Button } from '../../components/Button'
import { Gutter } from '../../components/Gutter'
import { getApolloClient } from '../../graphql'
import { FOOTER, HEADER, SETTINGS } from '../../graphql/globals'
import { useCart } from '../../providers/Cart'

import classes from './index.module.scss'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripePromise = loadStripe(apiKey)

const OrderConfirmation: React.FC = () => {
  const [message, setMessage] = useState(null)
  const { query } = useRouter()
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
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret)

      switch (paymentIntent.status) {
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
        {`Stripe Payment ID: ${query.payment_intent}`}
      </p>
      <Button href="/orders" appearance="primary" label="View orders" />
    </Gutter>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const apolloClient = getApolloClient()

  const { data } = await apolloClient.query({
    query: gql(`
      query {
        ${HEADER}
        ${FOOTER}
        ${SETTINGS}
      }
    `),
  })

  return {
    props: {
      header: data?.Header || null,
      footer: data?.Footer || null,
    },
  }
}

export default OrderConfirmation

'use client'
import { usePayments } from '@payloadcms/plugin-ecommerce/react'
import React from 'react'
import { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { CheckoutStripe } from '@/components/CheckoutStripe.js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type Props = {
  currenciesConfig: CurrenciesConfig
}

export const Payments: React.FC<Props> = ({ currenciesConfig }) => {
  const { selectedPaymentMethod, initiatePayment, confirmOrder, paymentData } = usePayments()

  return (
    <div>
      selected: {selectedPaymentMethod}
      <br />
      <button
        onClick={async () => {
          await initiatePayment('stripe')
        }}
      >
        Pay with Stripe
      </button>
      {selectedPaymentMethod === 'stripe' &&
        paymentData &&
        'clientSecret' in paymentData &&
        typeof paymentData.clientSecret === 'string' && (
          <div>
            <Elements stripe={stripePromise} options={{ clientSecret: paymentData.clientSecret }}>
              <CheckoutStripe />
            </Elements>
          </div>
        )}
    </div>
  )
}

'use client'

import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/react'
import React, { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation.js'

export const ConfirmOrder: React.FC = () => {
  const { confirmOrder } = usePayments()
  const { cart } = useCart()
  const confirmedOrder = useRef(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (!cart || cart.size === 0) {
      return
    }

    const paymentIntentID = searchParams.get('payment_intent')

    if (paymentIntentID) {
      confirmOrder('stripe', {
        additionalData: {
          paymentIntentID,
        },
      }).then((result) => {
        if (result && typeof result === 'object' && 'orderID' in result && result.orderID) {
          // Redirect to order confirmation page
          confirmedOrder.current = true
          router.push(`/shop/order/${result.orderID}`)
        }
      })
    }
  }, [cart, searchParams])

  return (
    <div>
      <h2>Confirm Order</h2>
      <div>
        <strong>Order Summary:</strong>
        LOADING
      </div>
    </div>
  )
}

import React from 'react'
import { Metadata } from 'next'

import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'
import OrderConfirmationPage from './OrderConfirmationPage/page'

import classes from './index.module.scss'

export default async function OrderConfirmation() {
  return (
    <Gutter className={classes.confirmationPage}>
      <h1>Order confirmed</h1>
      <OrderConfirmationPage />
      <Button href="/orders" appearance="primary" label="View orders" />
    </Gutter>
  )
}

export const metadata: Metadata = {
  title: 'Order Confirmation',
  description: 'Your order has been confirmed.',
  openGraph: mergeOpenGraph({
    title: 'Order Confirmation',
    url: '/order-confirmation',
  }),
}

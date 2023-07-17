import React from 'react'

import { Button } from '../../_components/Button'
import { Gutter } from '../../_components/Gutter'
import OrderConfirmationPage from './OrderConfirmationPage/page'

import classes from './index.module.scss'

const OrderConfirmation: React.FC = () => {
  return (
    <Gutter className={classes.confirmationPage}>
      <h1>Order confirmed</h1>
      <OrderConfirmationPage />
      <Button href="/orders" appearance="primary" label="View orders" />
    </Gutter>
  )
}

export default OrderConfirmation

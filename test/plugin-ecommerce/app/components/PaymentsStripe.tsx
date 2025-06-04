'use client'
import { usePayments } from '@payloadcms/plugin-ecommerce/react'
import React from 'react'
import { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

type Props = {
  currenciesConfig: CurrenciesConfig
}

export const PaymentsStripe: React.FC<Props> = ({ currenciesConfig }) => {
  const { selectedPaymentMethod, initiatePayment } = usePayments()

  return (
    <div>
      selected: {selectedPaymentMethod}
      <br />
    </div>
  )
}

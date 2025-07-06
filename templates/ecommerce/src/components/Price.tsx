'use client'
import { useCurrency } from '@payloadcms/plugin-ecommerce/react'
import React from 'react'

type BaseProps = {
  className?: string
  currencyCodeClassName?: string
}

type PriceFixed = {
  amount: number
  highestAmount?: never
  lowestAmount?: never
}

type PriceRange = {
  amount?: never
  highestAmount: number
  lowestAmount: number
}

type Props = BaseProps & (PriceFixed | PriceRange)

export const Price = ({
  amount,
  className,
  highestAmount,
  lowestAmount,
}: Props & React.ComponentProps<'p'>) => {
  const { formatCurrency } = useCurrency()

  if (amount) {
    return (
      <p className={className} suppressHydrationWarning>
        {formatCurrency(amount)}
      </p>
    )
  }

  if (highestAmount && highestAmount !== lowestAmount) {
    return (
      <p className={className} suppressHydrationWarning>
        {`${formatCurrency(lowestAmount)} - ${formatCurrency(highestAmount)}`}
      </p>
    )
  }

  if (lowestAmount) {
    return (
      <p className={className} suppressHydrationWarning>
        {`${formatCurrency(lowestAmount)}`}
      </p>
    )
  }

  return null
}

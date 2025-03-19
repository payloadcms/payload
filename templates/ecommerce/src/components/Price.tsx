import { formatNumberToCurrency } from '@/utilities/formatNumberToCurrency'
import React from 'react'

type BaseProps = {
  className?: string
  currencyCode: string
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
  currencyCode = 'usd',
  highestAmount,
  lowestAmount,
}: Props & React.ComponentProps<'p'>) => {
  if (amount) {
    return (
      <p className={className} suppressHydrationWarning>
        {formatNumberToCurrency(amount)}
      </p>
    )
  }

  if (highestAmount && highestAmount !== lowestAmount) {
    return (
      <p className={className} suppressHydrationWarning>
        {`${formatNumberToCurrency(lowestAmount)} - ${formatNumberToCurrency(highestAmount)}`}
      </p>
    )
  }

  if (lowestAmount) {
    return (
      <p className={className} suppressHydrationWarning>
        {`${formatNumberToCurrency(lowestAmount)}`}
      </p>
    )
  }

  return null
}

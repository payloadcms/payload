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
  currencyCode = 'USD',
  highestAmount,
  lowestAmount,
}: Props & React.ComponentProps<'p'>) => {
  if (amount) {
    return (
      <p className={className} suppressHydrationWarning>
        {`${new Intl.NumberFormat(undefined, {
          currency: currencyCode,
          currencyDisplay: 'narrowSymbol',
          style: 'currency',
        }).format(amount / 100)}`}
      </p>
    )
  }

  if (highestAmount && highestAmount !== lowestAmount) {
    return (
      <p className={className} suppressHydrationWarning>
        {`${new Intl.NumberFormat(undefined, {
          currency: currencyCode,
          currencyDisplay: 'narrowSymbol',
          style: 'currency',
        }).format(lowestAmount / 100)} - ${new Intl.NumberFormat(undefined, {
          currency: currencyCode,
          currencyDisplay: 'narrowSymbol',
          style: 'currency',
        }).format(highestAmount / 100)}`}
      </p>
    )
  }

  if (lowestAmount) {
    return (
      <p className={className} suppressHydrationWarning>
        {`${new Intl.NumberFormat(undefined, {
          currency: currencyCode,
          currencyDisplay: 'narrowSymbol',
          style: 'currency',
        }).format(lowestAmount / 100)}`}
      </p>
    )
  }

  return null
}

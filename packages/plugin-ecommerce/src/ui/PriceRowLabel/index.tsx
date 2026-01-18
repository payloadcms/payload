'use client'

import { useRowLabel } from '@ruya.sa/ui'
import { useMemo } from 'react'

import type { CurrenciesConfig } from '../../types/index.js'

import './index.css'
import { convertFromBaseValue } from '../utilities.js'

type Props = {
  currenciesConfig: CurrenciesConfig
}

export const PriceRowLabel: React.FC<Props> = (props) => {
  const { currenciesConfig } = props
  const { defaultCurrency, supportedCurrencies } = currenciesConfig

  const { data } = useRowLabel<{ amount: number; currency: string }>()

  const currency = useMemo(() => {
    if (data.currency) {
      return supportedCurrencies.find((c) => c.code === data.currency) ?? supportedCurrencies[0]
    }

    const fallbackCurrency = supportedCurrencies.find((c) => c.code === defaultCurrency)

    if (fallbackCurrency) {
      return fallbackCurrency
    }

    return supportedCurrencies[0]
  }, [data.currency, supportedCurrencies, defaultCurrency])

  const amount = useMemo(() => {
    if (data.amount) {
      return convertFromBaseValue({ baseValue: data.amount, currency: currency! })
    }

    return '0'
  }, [currency, data.amount])

  return (
    <div className="priceRowLabel">
      <div className="priceLabel">Price:</div>

      <div className="priceValue">
        <span>
          {currency?.symbol}
          {amount}
        </span>
        <span>({data.currency})</span>
      </div>
    </div>
  )
}

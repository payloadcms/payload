'use client'

import { useRowLabel, useTranslation } from '@payloadcms/ui'
import { useMemo } from 'react'

import type { CurrenciesConfig } from '../../types/index.js'

import './index.css'
import { formatPrice } from '../utilities.js'

type Props = {
  currenciesConfig: CurrenciesConfig
}

export const PriceRowLabel: React.FC<Props> = (props) => {
  const { currenciesConfig } = props
  const { defaultCurrency, supportedCurrencies } = currenciesConfig

  const { i18n } = useTranslation()
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

  const formattedPrice = useMemo(() => {
    if (!currency) {
      return '0'
    }

    return formatPrice({ baseValue: data.amount ?? 0, currency, locale: i18n.language })
  }, [currency, data.amount, i18n.language])

  return (
    <div className="priceRowLabel">
      <div className="priceLabel">Price:</div>

      <div className="priceValue">
        <span>{formattedPrice}</span>
        <span>({data.currency})</span>
      </div>
    </div>
  )
}

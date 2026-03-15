'use client'
import type { DefaultCellComponentProps, TypedCollection } from 'payload'

import { useTranslation } from '@payloadcms/ui'

import type { CurrenciesConfig, Currency } from '../../types/index.js'

import { convertFromBaseValue } from '../utilities.js'

type Props = {
  cellData?: number
  currenciesConfig: CurrenciesConfig
  currency?: Currency
  path: string
  rowData: Partial<TypedCollection['products']>
} & DefaultCellComponentProps

export const PriceCell: React.FC<Props> = (args) => {
  const { t } = useTranslation()
  const { cellData, currenciesConfig, currency: currencyFromProps, rowData } = args

  const currency = currencyFromProps || currenciesConfig.supportedCurrencies[0]
  const hasValidCellData = typeof cellData === 'number' && !Number.isNaN(cellData)

  if (!currency) {
    return <span>{t('plugin-ecommerce:currencyNotSet')}</span>
  }

  if (!hasValidCellData && 'enableVariants' in rowData && rowData.enableVariants) {
    return <span>{t('plugin-ecommerce:priceSetInVariants')}</span>
  }

  if (!hasValidCellData) {
    return <span>{t('plugin-ecommerce:priceNotSet')}</span>
  }

  return (
    <span>
      {currency.symbol}
      {convertFromBaseValue({ baseValue: cellData, currency })}
    </span>
  )
}

'use client'
import type { DefaultCellComponentProps, TypedCollection } from 'payload'

import { useTranslation } from '@payloadcms/ui'

import type { CurrenciesConfig, Currency } from '../../types/index.js'

import { useCurrency } from '../../react/provider/index.js'

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
  const { formatCurrency } = useCurrency()
  const currency = currencyFromProps || currenciesConfig.supportedCurrencies[0]

  if (!currency) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:currencyNotSet')}</span>
  }

  if (
    (!cellData || typeof cellData !== 'number') &&
    'enableVariants' in rowData &&
    rowData.enableVariants
  ) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:priceSetInVariants')}</span>
  }

  if (!cellData) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:priceNotSet')}</span>
  }

  return (
    <div className="priceCell">
      <span className="priceValue">{formatCurrency(cellData, { currency })}</span>
    </div>
  )
}

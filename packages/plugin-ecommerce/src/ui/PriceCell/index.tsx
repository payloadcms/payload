'use client'

import type { DefaultCellComponentProps, TypedCollection } from 'payload'

import { useTranslation } from '@payloadcms/ui'

import type { CurrenciesConfig, Currency } from '../../types/index.js'

import { formatPrice } from '../utilities.js'

type Props = {
  cellData?: number
  currenciesConfig: CurrenciesConfig
  currency?: Currency
  path: string
  rowData: Partial<TypedCollection['products']>
} & DefaultCellComponentProps

export const PriceCell: React.FC<Props> = (args) => {
  const { i18n, t } = useTranslation()
  const { cellData, currenciesConfig, currency: currencyFromProps, rowData } = args

  const currency = currencyFromProps || currenciesConfig.supportedCurrencies[0]

  if (!currency) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:currencyNotSet')}</span>
  }

  if (
    (cellData == null || typeof cellData !== 'number') &&
    'enableVariants' in rowData &&
    rowData.enableVariants
  ) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:priceSetInVariants')}</span>
  }

  if (cellData == null) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:priceNotSet')}</span>
  }

  return <span>{formatPrice({ baseValue: cellData, currency, locale: i18n.language })}</span>
}

// 'use client'
// import type { DefaultCellComponentProps, TypedCollection } from 'payload'

// import { useTranslation } from '@payloadcms/ui'

// import type { CurrenciesConfig, Currency } from '../../types/index.js'

// import { useCurrency } from '../../react/provider/index.js'

// type Props = {
//   cellData?: number
//   currenciesConfig: CurrenciesConfig
//   currency?: Currency
//   path: string
//   rowData: Partial<TypedCollection['products']>
// } & DefaultCellComponentProps

// export const PriceCell: React.FC<Props> = (args) => {
//   const { t } = useTranslation()
//   const { cellData, currenciesConfig, currency: currencyFromProps, rowData } = args
//   const { formatCurrency } = useCurrency()
//   const currency = currencyFromProps || currenciesConfig.supportedCurrencies[0]

// const formatPrice = (
//   baseValue: number,
//   currency: Currency,
//   locale = 'en',
// ): string => {
//   return new Intl.NumberFormat(locale, {
//     style: 'currency',
//     currency: currency.code,
//     currencyDisplay: currency.symbolDisplay ?? 'symbol',
//     minimumFractionDigits: currency.decimals,
//     maximumFractionDigits: currency.decimals,
//   }).format(baseValue / Math.pow(10, currency.decimals))
// }

//   if (!currency) {
//     // @ts-expect-error - plugin translations are not typed yet
//     return <span>{t('plugin-ecommerce:currencyNotSet')}</span>
//   }

//   if (
//     (!cellData || typeof cellData !== 'number') &&
//     'enableVariants' in rowData &&
//     rowData.enableVariants
//   ) {
//     // @ts-expect-error - plugin translations are not typed yet
//     return <span>{t('plugin-ecommerce:priceSetInVariants')}</span>
//   }

//   if (!cellData) {
//     // @ts-expect-error - plugin translations are not typed yet
//     return <span>{t('plugin-ecommerce:priceNotSet')}</span>
//   }

//   return (
//     <div className="priceCell">
//       <span className="priceValue">{formatCurrency(cellData, { currency })}</span>
//     </div>
//   )
// }

'use client'

import type { DefaultCellComponentProps, TypedCollection } from 'payload'

import { useTranslation } from '@payloadcms/ui'

import type { CurrenciesConfig, Currency } from '../../types/index.js'

type Props = {
  cellData?: number
  currenciesConfig: CurrenciesConfig
  currency?: Currency
  path: string
  rowData: Partial<TypedCollection['products']>
} & DefaultCellComponentProps

/**
 * NOTE:
 * This formatter intentionally duplicates logic used elsewhere (e.g. in react hooks)
 * to keep PriceCell independent from the react bundle.
 * Once bundling constraints are clarified, this can be extracted to a shared utility.
 */
const formatPrice = (baseValue: number, currency: Currency, locale = 'en'): string => {
  return new Intl.NumberFormat(locale, {
    currency: currency.code,
    currencyDisplay: currency.symbolDisplay ?? 'symbol',
    maximumFractionDigits: currency.decimals,
    minimumFractionDigits: currency.decimals,
    style: 'currency',
  }).format(baseValue / Math.pow(10, currency.decimals))
}

export const PriceCell: React.FC<Props> = (args) => {
  const { t } = useTranslation()
  const { cellData, currenciesConfig, currency: currencyFromProps, rowData } = args

  const currency = currencyFromProps || currenciesConfig.supportedCurrencies[0]

  if (!currency) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:currencyNotSet')}</span>
  }

  if (
    (cellData === undefined || typeof cellData !== 'number') &&
    'enableVariants' in rowData &&
    rowData.enableVariants
  ) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:priceSetInVariants')}</span>
  }

  if (cellData === undefined) {
    // @ts-expect-error - plugin translations are not typed yet
    return <span>{t('plugin-ecommerce:priceNotSet')}</span>
  }

  return (
    <div className="priceCell">
      <span className="priceValue">{formatPrice(cellData, currency)}</span>
    </div>
  )
}

'use client'
import type { NumberFieldClientProps } from 'payload'

import { useField, useFormFields } from '@payloadcms/ui'

import './index.scss'

import type { CurrenciesConfig, Currency } from '../../types.js'

import { FormattedInput } from './FormattedInput.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  currency?: Currency
  path: string
} & NumberFieldClientProps

export const PriceInput: React.FC<Props> = (args) => {
  const {
    currenciesConfig,
    currency: currencyFromProps,
    field: { label },
    path,
  } = args

  const { setValue, value } = useField<number>({ path })
  const parentPath = path.split('.').slice(0, -1).join('.')
  const currencyPath = parentPath ? `${parentPath}.currency` : 'currency'

  const currencyFromSelectField = useFormFields(([fields, dispatch]) => fields[currencyPath])

  const currencyCode = currencyFromProps?.code ?? (currencyFromSelectField?.value as string)

  return (
    <FormattedInput
      currency={currencyCode}
      label={label}
      onChange={(value) => setValue(value)}
      supportedCurrencies={currenciesConfig?.supportedCurrencies}
      value={value}
    />
  )
}

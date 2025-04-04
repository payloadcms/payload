'use client'
import type { NumberFieldClientProps } from 'payload'

import { useField, useFormFields } from '@payloadcms/ui'

import './index.scss'

import type { CurrenciesConfig } from '../../types.js'

import { FormattedInput } from './FormattedInput.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  path: string
} & NumberFieldClientProps

export const PriceInput: React.FC<Props> = (args) => {
  const {
    currenciesConfig,
    field: { label },
    path,
  } = args

  const { setValue, value } = useField<number>({ path })
  const parentPath = path.split('.').slice(0, -1).join('.')
  const currencyPath = parentPath ? `${parentPath}.currency` : 'currency'

  const currency = useFormFields(([fields, dispatch]) => fields[currencyPath])

  return (
    <FormattedInput
      currency={currency?.value as string}
      label={label}
      onChange={(value) => setValue(value)}
      supportedCurrencies={currenciesConfig?.supportedCurrencies}
      value={value || 0}
    />
  )
}

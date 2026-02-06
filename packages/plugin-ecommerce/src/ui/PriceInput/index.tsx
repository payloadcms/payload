import type { NumberFieldServerProps } from 'payload'

import './index.css'

import type { CurrenciesConfig, Currency } from '../../types/index.js'

import { FormattedInput } from './FormattedInput.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  currency?: Currency
  path: string
} & NumberFieldServerProps

export const PriceInput: React.FC<Props> = (args) => {
  const {
    clientField: { label },
    currenciesConfig,
    currency: currencyFromProps,
    field,
    i18n: { t },
    i18n,
    path,
    readOnly,
  } = args

  const description = field.admin?.description
    ? typeof field.admin.description === 'function'
      ? // @ts-expect-error - weird type issue on 't' here
        field.admin.description({ i18n, t })
      : field.admin.description
    : undefined

  return (
    <FormattedInput
      currency={currencyFromProps}
      description={description}
      label={label}
      path={path}
      readOnly={readOnly}
      supportedCurrencies={currenciesConfig?.supportedCurrencies}
    />
  )
}

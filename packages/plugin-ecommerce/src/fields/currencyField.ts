import type { SelectField } from '@ruya.sa/payload'

import type { CurrenciesConfig } from '../types/index.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  overrides?: Partial<SelectField>
}

export const currencyField: (props: Props) => SelectField = ({ currenciesConfig, overrides }) => {
  const options = currenciesConfig.supportedCurrencies.map((currency) => {
    const label = currency.label ? `${currency.label} (${currency.code})` : currency.code

    return {
      label,
      value: currency.code,
    }
  })

  const defaultValue =
    (currenciesConfig.defaultCurrency ?? currenciesConfig.supportedCurrencies.length === 1)
      ? currenciesConfig.supportedCurrencies[0]?.code
      : undefined

  // @ts-expect-error - issue with payload types
  const field: SelectField = {
    name: 'currency',
    type: 'select',
    label: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-ecommerce:currency'),
    ...(defaultValue && { defaultValue }),
    options,
    ...overrides,
    admin: { readOnly: currenciesConfig.supportedCurrencies.length === 1, ...overrides?.admin },
  }

  return field
}

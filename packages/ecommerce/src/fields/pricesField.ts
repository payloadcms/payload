import type { ArrayField } from 'payload'

import type { CurrenciesConfig } from '../types.js'

import { amountField } from './amountField.js'
import { currencyField } from './currencyField.js'

type Props = {
  /**
   * Use this to specify a path for the condition.
   */
  conditionalPath?: string
  currenciesConfig: CurrenciesConfig
  enableVariants?: boolean
  overrides?: Partial<ArrayField>
}

export const pricesField: (props: Props) => ArrayField = ({
  conditionalPath,
  currenciesConfig,
  enableVariants,
  overrides,
}) => {
  const minRows = 1
  const maxRows = currenciesConfig.supportedCurrencies.length ?? 1

  const defaultCurrency =
    (currenciesConfig.defaultCurrency ?? currenciesConfig.supportedCurrencies.length === 1)
      ? currenciesConfig.supportedCurrencies[0]?.code
      : undefined

  const defaultValue = [
    {
      amount: 0,
      currency: defaultCurrency,
    },
  ]

  const field: ArrayField = {
    name: 'prices',
    type: 'array',
    maxRows,
    minRows,
    ...(defaultValue && { defaultValue }),
    ...overrides,
    admin: {
      components: {
        RowLabel: {
          clientProps: {
            currenciesConfig,
          },
          path: '@payloadcms/ecommerce/ui#PriceRowLabel',
        },
      },
      initCollapsed: true,
      ...(enableVariants
        ? {
            condition: (data) => {
              const path = conditionalPath ?? 'enableVariants'

              return !data?.[path]
            },
          }
        : {}),
      readOnly: maxRows === minRows,
    },
    fields: [amountField({ currenciesConfig }), currencyField({ currenciesConfig })],
  }

  return field
}

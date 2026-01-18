import type { NumberField } from '@ruya.sa/payload'

import type { CurrenciesConfig, Currency } from '../types/index.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  /**
   * Use this specific currency for the field.
   */
  currency?: Currency
  overrides?: Partial<NumberField>
}

export const amountField: (props: Props) => NumberField = ({
  currenciesConfig,
  currency,
  overrides,
}) => {
  // @ts-expect-error - issue with payload types
  const field: NumberField = {
    name: 'amount',
    type: 'number',
    label: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-ecommerce:amount'),
    ...overrides,
    admin: {
      components: {
        Cell: {
          clientProps: {
            currenciesConfig,
            currency,
          },
          path: '@ruya.sa/plugin-ecommerce/client#PriceCell',
        },
        Field: {
          clientProps: {
            currenciesConfig,
            currency,
          },
          path: '@ruya.sa/plugin-ecommerce/rsc#PriceInput',
        },
        ...overrides?.admin?.components,
      },
      ...overrides?.admin,
    },
  }

  return field
}

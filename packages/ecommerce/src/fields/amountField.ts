import type { NumberField } from 'payload'

import type { CurrenciesConfig } from '../types.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  overrides?: Partial<NumberField>
}

export const amountField: (props: Props) => NumberField = ({ currenciesConfig, overrides }) => {
  // @ts-expect-error - issue with payload types
  const field: NumberField = {
    name: 'amount',
    type: 'number',
    ...overrides,
    admin: {
      components: {
        Field: {
          clientProps: {
            currenciesConfig,
          },
          path: '@payloadcms/ecommerce/ui#PriceInput',
        },
        ...overrides?.admin?.components,
      },
      ...overrides?.admin,
    },
  }

  return field
}

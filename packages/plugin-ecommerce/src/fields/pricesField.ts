import type { ArrayField, GroupField } from 'payload'

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

export const pricesField: (props: Props) => GroupField[] = ({
  conditionalPath,
  currenciesConfig,
  enableVariants,
  overrides,
}) => {
  const currencies = currenciesConfig.supportedCurrencies

  const fields: GroupField[] = currencies.map((currency) => {
    const name = `priceIn${currency.code}`
    const label = `Price (${currency.code})`

    return {
      name,
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
        },
        amountField({
          currenciesConfig,
          currency,
          overrides: {
            admin: {
              condition: (_, siblingData) => Boolean(siblingData?.enabled),
            },
          },
        }),
      ],
      label,
    }
  })

  return fields
}

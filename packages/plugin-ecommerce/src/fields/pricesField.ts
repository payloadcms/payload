import type { GroupField } from 'payload'

import type { CurrenciesConfig } from '../types.js'

import { amountField } from './amountField.js'

type Props = {
  /**
   * Use this to specify a path for the condition.
   */
  conditionalPath?: string
  currenciesConfig: CurrenciesConfig
}

export const pricesField: (props: Props) => GroupField[] = ({
  conditionalPath,
  currenciesConfig,
}) => {
  const currencies = currenciesConfig.supportedCurrencies

  const fields: GroupField[] = currencies.map((currency) => {
    const name = `priceIn${currency.code}`
    const label = `Price (${currency.code})`

    const path = conditionalPath ? `${conditionalPath}.${name}Enabled` : `${name}Enabled`

    return {
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: `${name}Enabled`,
              type: 'checkbox',
              admin: {
                style: {
                  alignSelf: 'baseline',
                  flex: '0 0 auto',
                },
              },
              label: `Enable ${currency.code} Price`,
            },
            amountField({
              currenciesConfig,
              currency,
              overrides: {
                name,
                admin: {
                  condition: (_, siblingData) => Boolean(siblingData?.[path]),
                },
                label,
              },
            }),
          ],
        },
      ],
    }
  })

  return fields
}

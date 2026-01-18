import type { GroupField } from '@ruya.sa/payload'

import type { CurrenciesConfig } from '../types/index.js'

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

    const path = conditionalPath ? `${conditionalPath}.${name}Enabled` : `${name}Enabled`

    return {
      type: 'group',
      admin: {
        description: 'Prices for this product in different currencies.',
      },
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
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:enableCurrencyPrice', { currency: currency.code }),
            },
            amountField({
              currenciesConfig,
              currency,
              overrides: {
                name,
                admin: {
                  condition: (_, siblingData) => Boolean(siblingData?.[path]),
                  description: ({ t }) =>
                    // @ts-expect-error - translations are not typed in plugins yet
                    t('plugin-ecommerce:productPriceDescription'),
                },
                // @ts-expect-error - translations are not typed in plugins yet
                label: ({ t }) => t('plugin-ecommerce:priceIn', { currency: currency.code }),
              },
            }),
          ],
        },
      ],
    }
  })

  return fields
}

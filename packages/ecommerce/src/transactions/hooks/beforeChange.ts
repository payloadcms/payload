import type { CollectionBeforeChangeHook } from 'payload'

import type { CurrenciesConfig, PaymentAdapter } from '../../types.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  paymentMethods?: PaymentAdapter[]
}

export const beforeChange: (props: Props) => CollectionBeforeChangeHook =
  (props) =>
  async ({ data, operation, originalDoc, req }) => {
    const { currenciesConfig, paymentMethods } = props

    if (operation === 'create') {
      if (data.status !== 'succeeded') {
        data.status = 'pending'
      }

      const currency: string = data.currency || currenciesConfig.defaultCurrency!

      let total = 0

      for (const item of data.cartSnapshot) {
        if (item.variant) {
          const variant = await req.payload.findByID({
            id: item.variant,
            collection: 'variants',
            select: {
              prices: true,
            },
          })

          if (variant) {
            const price = variant.prices.find((price) => price.currency === currency)

            total += price?.amount || 0
          }
        } else {
          const product = await req.payload.findByID({
            id: item.product,
            collection: 'products',
            select: {
              prices: true,
            },
          })

          if (product) {
            const price = product.prices.find((price) => price.currency === currency)

            total += price?.amount || 0
          }
        }
      }

      data.amount = total
    }

    return data
  }

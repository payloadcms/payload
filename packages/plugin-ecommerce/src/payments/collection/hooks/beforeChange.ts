import type { CollectionBeforeChangeHook } from 'payload'

import type { CurrenciesConfig, PaymentAdapter } from '../../../types.js'

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
      const pricePath = `priceIn${currency}`

      let total = 0

      console.log({ cartSnapshot: data.cartSnapshot[0] })

      for (const item of data.cartSnapshot) {
        if (item.variant) {
          const variant = await req.payload.findByID({
            id: item.variant,
            collection: 'variants',
            select: {
              [pricePath]: true,
            },
          })

          if (variant) {
            const price = variant[pricePath].amount

            total += price?.amount || 0
          }
        } else {
          console.log('fetching for', item.product)
          const product = await req.payload.findByID({
            id: item.product,
            collection: 'products',
            select: {
              [pricePath]: true,
            },
          })

          // console.log({ product })

          if (product) {
            const price = product[pricePath]

            console.log({ price })

            total += price?.amount || 0
          }
        }
      }

      data.amount = total

      // Run the logic for the payment method after totals are calculated
      // console.log({ data })
      // if (data.paymentMethod) {
      //   const paymentMethod = paymentMethods?.find((method) => method.name === data.paymentMethod)

      //   console.log({ paymentMethod })
      //   if (paymentMethod && paymentMethod.hooks?.createTransaction) {
      //     const paymentIntent = await paymentMethod.hooks.createTransaction({
      //       data,
      //       operation: 'create',
      //       req,
      //     })

      //     // console.log({ paymentIntent })
      //   }
      // }
    }

    return data
  }

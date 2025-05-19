import type { CollectionBeforeChangeHook } from 'payload'

import type { CurrenciesConfig, PaymentAdapter } from '../../types.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  paymentMethods?: PaymentAdapter[]
}

export const beforeChangePayments: (props: Props) => CollectionBeforeChangeHook =
  (props) =>
  async ({ data, operation, originalDoc, req }) => {
    const { currenciesConfig, paymentMethods } = props

    if (operation === 'create') {
      if (data.paymentMethod) {
        const paymentMethod = paymentMethods?.find((method) => method.name === data.paymentMethod)

        console.log({ paymentMethod })
        if (paymentMethod && paymentMethod.hooks?.createTransaction) {
          const paymentIntent = await paymentMethod.hooks.createTransaction({
            data,
            operation: 'create',
            req,
          })

          // console.log({ paymentIntent })
        }
      }
    }

    return data
  }

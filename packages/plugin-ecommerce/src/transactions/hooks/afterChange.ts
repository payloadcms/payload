import type { CollectionAfterChangeHook } from 'payload'

import type { CurrenciesConfig, PaymentAdapter } from '../../types.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  paymentMethods?: PaymentAdapter[]
}

export const afterChange: (props: Props) => CollectionAfterChangeHook =
  (props) =>
  async ({ doc, operation, req }) => {
    const { currenciesConfig, paymentMethods } = props

    if (doc.status === 'succeeded' && !doc.order) {
      const order = await req.payload.create({
        collection: 'orders',
        data: {
          amount: doc.amount,
          cartItems: doc.cartSnapshot,
          currency: doc.currency,
          customer: doc.customer,
          status: 'processing',
          transaction: doc.id,
        },
      })

      if (order) {
        doc.order = order.id
      }
    }

    return doc
  }

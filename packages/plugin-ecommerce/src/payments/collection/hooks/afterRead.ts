import type { CollectionAfterReadHook } from 'payload'

import type { CurrenciesConfig, PaymentAdapter } from '../../../types.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  paymentMethods?: PaymentAdapter[]
}

export const afterRead: (props: Props) => CollectionAfterReadHook =
  (props) =>
  ({ doc, req }) => {
    const { currenciesConfig, paymentMethods } = props

    if (req.context?.ecommerce?.return) {
      return {
        ...doc,
        ...req.context.ecommerce.return,
      }
    }

    return doc
  }

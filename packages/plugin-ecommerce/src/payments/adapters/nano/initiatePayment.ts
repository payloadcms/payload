import type { PaymentAdapter } from '../../../types/index.js'
import type { InitiatePaymentReturnType } from './index.js'

import { bindingRepresentative, quoteRaw, rawToXno } from './nano.js'

type Props = {
  account: string
  prices: Record<string, string>
}

export const initiatePayment: (props: Props) => NonNullable<PaymentAdapter>['initiatePayment'] =
  (props) =>
  async ({ data, req, transactionsSlug }) => {
    const payload = req.payload
    const { account, prices } = props

    const customerEmail = data.customerEmail
    const currency = typeof data.currency === 'string' ? data.currency.toUpperCase() : undefined
    const cart = data.cart
    const amount = cart?.subtotal
    const billingAddressFromData = data.billingAddress
    const shippingAddressFromData = data.shippingAddress

    if (!currency) {
      throw new Error('Currency is required.')
    }

    const xnoPerUnit = prices[currency]

    if (!xnoPerUnit) {
      throw new Error(`Nano payments are not configured for ${currency}.`)
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty or not provided.')
    }

    if (!customerEmail || typeof customerEmail !== 'string') {
      throw new Error('A valid customer email is required to make a purchase.')
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('A valid amount is required to initiate a payment.')
    }

    const priceRaw = quoteRaw({ amount, xnoPerUnit })
    const reference = globalThis.crypto.randomUUID()
    const representative = bindingRepresentative({ payTo: account, priceRaw, reference })

    const flattenedCart = cart.items.map((item) => {
      const productID = typeof item.product === 'object' ? item.product.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant.id
          : item.variant
        : undefined

      // Preserve any additional custom properties (e.g., deliveryOption, customizations)
      // that may have been added via cartItemMatcher
      const { product: _product, variant: _variant, ...customProperties } = item

      return {
        ...customProperties,
        product: productID,
        quantity: item.quantity,
        ...(variantID ? { variant: variantID } : {}),
      }
    })

    try {
      const transaction = await payload.create({
        collection: transactionsSlug,
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount,
          billingAddress: billingAddressFromData,
          cart: cart.id,
          currency,
          items: flattenedCart,
          nano: {
            amountRaw: priceRaw.toString(),
            payTo: account,
            reference,
            representative,
            ...(shippingAddressFromData ? { shippingAddress: shippingAddressFromData } : {}),
          },
          paymentMethod: 'nano',
          status: 'pending',
        },
        overrideAccess: true,
        req,
      })

      const returnData: InitiatePaymentReturnType = {
        amountRaw: priceRaw.toString(),
        amountXNO: rawToXno(priceRaw),
        message: 'Payment initiated successfully',
        payTo: account,
        reference,
        representative,
        transactionID: transaction.id,
      }

      return returnData
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Error initiating payment with Nano' })

      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
    }
  }

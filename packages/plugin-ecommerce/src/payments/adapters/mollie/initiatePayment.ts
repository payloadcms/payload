import { createMollieClient } from '@mollie/api-client'

import type { PaymentAdapter } from '../../../types/index.js'
import type { InitiatePaymentReturnType, MollieAdapterArgs } from './index.js'

import { getOrCreateMollieCustomer } from './utils.js'

type Props = {
  apiKey: MollieAdapterArgs['apiKey']
  createPayment?: MollieAdapterArgs['createPayment']
}

export const initiatePayment: (props: Props) => NonNullable<PaymentAdapter>['initiatePayment'] =
  (props) =>
  async ({ customersSlug = 'users', data, req, transactionsSlug }) => {
    const payload = req.payload
    const { apiKey, createPayment } = props || {}

    const customerEmail = data.customerEmail
    const currency = data.currency
    const cart = data.cart
    const amount = cart.subtotal
    const billingAddressFromData = data.billingAddress
    const shippingAddressFromData = data.shippingAddress

    if (!apiKey) {
      throw new Error('Mollie API key is required.')
    }

    if (!currency) {
      throw new Error('Currency is required.')
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

    const mollie = createMollieClient({
      apiKey,
    })

    try {
      const customer = await getOrCreateMollieCustomer({
        customerEmail,
        customersSlug,
        mollie,
        payload,
      })

      const flattenedCart = cart.items.map((item) => {
        const productID = typeof item.product === 'object' ? item.product.id : item.product
        const variantID = item.variant
          ? typeof item.variant === 'object'
            ? item.variant.id
            : item.variant
          : undefined

        return {
          product: productID,
          quantity: item.quantity,
          variant: variantID,
        }
      })

      const shippingAddressAsString = JSON.stringify(shippingAddressFromData)

      const parameters = await createPayment?.({
        amount,
        currency,
        customer,
      })

      const payment = await mollie.payments.create({
        ...parameters,
        amount: {
          // Must be in format '10.00' as string
          value: (amount / 100).toFixed(2),
          // Must be a valid ISO 4217 currency code
          currency: currency.toUpperCase(),
        },
        customerId: customer.id,
        // This will appear on the customer's bank statement
        // Use the cart ID as a description for now
        description: parameters?.description || `${cart.id}`,
        // TODO: billingAddress: {},
        // TODO: shippingAddress: {},
        metadata: {
          ...(parameters?.metadata ?? {}),
          // Ensure that these are always included and cannot be overridden
          cartID: cart.id,
          cartItemsSnapshot: JSON.stringify(flattenedCart),
          shippingAddress: shippingAddressAsString,
        },
      })

      // Create a transaction for the payment intent in the database
      const transaction = await payload.create({
        collection: transactionsSlug,
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount: Number(payment.amount.value) * 100,
          billingAddress: billingAddressFromData,
          cart: cart.id,
          currency: payment.amount.currency,
          items: flattenedCart,
          mollie: {
            customerID: customer.id,
            paymentID: payment.id,
          },
          paymentMethod: 'mollie',
          status: 'pending',
        },
      })

      const returnData: InitiatePaymentReturnType = {
        href: payment._links.checkout?.href || '',
        message: 'Payment initiated successfully',
        paymentID: payment.id,
      }

      return returnData
    } catch (error) {
      payload.logger.error(error, 'Error initiating payment with Mollie')

      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
    }
  }

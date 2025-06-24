import type { DefaultDocumentIDType } from 'payload'
import type React from 'react'

import type {
  CartClient,
  CartItemClient,
  CurrenciesConfig,
  Currency,
  PaymentAdapterClient,
} from '../../types.js'

export type SyncLocalStorageConfig = {
  /**
   * Key to use for localStorage.
   * Defaults to 'cart'.
   */
  key?: string
}

export type ContextProps = {
  children?: React.ReactNode
  /**
   * The configuration for currencies used in the ecommerce context.
   * This is required to handle currency formatting and calculations even if you only use a single currency.
   */
  currenciesConfig: CurrenciesConfig
  /**
   * Supported payment methods for the ecommerce context.
   */
  paymentMethods?: PaymentAdapterClient[]
  /**
   * Whether to enable localStorage for cart persistence.
   * Defaults to true.
   */
  syncLocalStorage?: boolean | SyncLocalStorageConfig
}

export type EcommerceContext = {
  /**
   * Add an item to the cart.
   */
  addItem: (item: CartItemClient) => void
  /**
   * The current cart state, represented as a Map where the key is the variant ID or product ID.
   */
  cart: Map<DefaultDocumentIDType, CartItemClient>
  /**
   * Clear the cart, removing all items.
   */
  clearCart: () => void
  /**
   * Initiate a payment using the selected payment method.
   * This method should be called after the cart is ready for checkout.
   * It requires the payment method ID and any necessary payment data.
   */
  confirmOrder: (
    paymentMethodID: string,
    options?: { additionalData: Record<string, unknown> },
  ) => Promise<unknown>
  /**
   * The currently selected currency for the cart.
   * This is used for calculations and price formatting.
   */
  currency: Currency
  /**
   * Decrement an item in the cart by its variant ID or product ID.
   * If the item has a variantID, it will be used; otherwise, productID will be used.
   * If quantity reaches 0, the item will be removed from the cart.
   */
  decrementItem: (item: DefaultDocumentIDType) => void
  /**
   * Increment an item in the cart by its variant ID or product ID.
   * If the item has a variantID, it will be used; otherwise, productID will be used.
   */
  incrementItem: (item: DefaultDocumentIDType) => void
  /**
   * Initiate a payment using the selected payment method.
   * This method should be called after the cart is ready for checkout.
   * It requires the payment method ID and any necessary payment data.
   */
  initiatePayment: (
    paymentMethodID: string,
    options?: { additionalData: Record<string, unknown> },
  ) => Promise<unknown>
  /**
   *
   */
  paymentData?: Record<string, unknown>
  /**
   * Remove an item from the cart by its variant ID or product ID.
   * If the item has a variantID, it will be used; otherwise, productID will be used.
   */
  removeItem: (item: DefaultDocumentIDType) => void
  /**
   * The name of the currently selected payment method.
   * This is used to determine which payment method to use when initiating a payment.
   */
  selectedPaymentMethod?: null | string
  /**
   * Change the currency for the cart, it defaults to the configured currency.
   * This will update the currency used for pricing and calculations.
   */
  setCurrency: (currency: string) => void
  /**
   * The subtotal of the cart, calculated as the sum of all item prices multiplied by their quantities.
   * This does not include taxes or shipping costs.
   */
  subTotal: number
}

export type CartAction =
  | {
      payload: CartClient
      type: 'MERGE_CART'
    }
  | {
      payload: CartClient
      type: 'SET_CART'
    }
  | {
      payload: CartItemClient
      type: 'ADD_ITEM'
    }
  | {
      payload: DefaultDocumentIDType
      type: 'DECREMENT_QUANTITY'
    }
  | {
      payload: DefaultDocumentIDType
      type: 'INCREMENT_QUANTITY'
    }
  | {
      payload: DefaultDocumentIDType
      type: 'REMOVE_ITEM'
    }
  | {
      type: 'CLEAR_CART'
    }

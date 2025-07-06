import type { DefaultDocumentIDType, TypedCollection } from 'payload'
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
   * This is used to handle currency formatting and calculations, defaults to USD.
   */
  currenciesConfig?: CurrenciesConfig
  /**
   * The slug for the customers collection.
   * This is used in fetch requests to identify the customers collection.
   *
   * Defaults to 'users'.
   */
  customersSlug?: string
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

type CartItemArgument = {
  /**
   * The ID of the product to add to the cart. Always required.
   */
  product: DefaultDocumentIDType
  /**
   * The ID of the variant to add to the cart. Optional, if not provided, the product will be added without a variant.
   */
  variant?: DefaultDocumentIDType
}

export type EcommerceContext<TCart = TypedCollection['carts']> = {
  /**
   * Add an item to the cart.
   */
  addItem: (item: CartItemArgument, quantity?: number) => Promise<void>
  /**
   * The current data of the cart.
   */
  cart?: TypedCollection['carts']
  /**
   * The ID of the current cart corresponding to the cart in the database or local storage.
   */
  cartID?: DefaultDocumentIDType
  /**
   * Clear the cart, removing all items.
   */
  clearCart: () => Promise<void>
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
  decrementItem: (item: DefaultDocumentIDType) => Promise<void>
  /**
   * Increment an item in the cart by its variant ID or product ID.
   * If the item has a variantID, it will be used; otherwise, productID will be used.
   */
  incrementItem: (item: DefaultDocumentIDType) => Promise<void>
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
  removeItem: (item: DefaultDocumentIDType) => Promise<void>
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

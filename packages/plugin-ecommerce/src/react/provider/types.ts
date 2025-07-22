import type {
  DefaultDocumentIDType,
  PopulateType,
  SelectType,
  TypedCollection,
  Where,
} from 'payload'
import type React from 'react'

import type { CurrenciesConfig, Currency, PaymentAdapterClient } from '../../types.js'

export type SyncLocalStorageConfig = {
  /**
   * Key to use for localStorage.
   * Defaults to 'cart'.
   */
  key?: string
}

type APIProps = {
  /**
   * The route for the Payload API, defaults to `/api`.
   */
  apiRoute?: string
  /**
   * Customise the query used to fetch carts. Use this when you need to fetch additional data and optimise queries using depth, select and populate.
   *
   * Defaults to `{ depth: 0 }`.
   */
  cartsFetchQuery?: {
    depth?: number
    populate?: PopulateType
    select?: SelectType
  }
  /**
   * The route for the Payload API, defaults to ``. Eg for a Payload app running on `http://localhost:3000`, the default serverURL would be `http://localhost:3000`.
   */
  serverURL?: string
}

export type ContextProps = {
  api?: APIProps
  /**
   * The slug for the carts collection.
   * This is used in fetch requests to identify the carts collection.
   * Defaults to 'carts'.
   */
  cartsSlug?: string
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
   * Enable debug mode for the ecommerce context.
   * Defaults to false.
   */
  debug?: boolean
  /**
   * Whether to enable support for variants in the cart.
   * This allows adding products with specific variants to the cart.
   * Defaults to false.
   */
  enableVariants?: boolean
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

/**
 * Type used internally to represent the cart item to be added.
 */
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

export type EcommerceContext = {
  /**
   * Add an item to the cart.
   */
  addItem: (item: CartItemArgument, quantity?: number) => Promise<void>
  /**
   * Apply coupon.
   */
  applyCoupon: (couponCode: string) => Promise<void>
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
   * The configuration for the currencies used in the ecommerce context.
   */
  currenciesConfig: CurrenciesConfig
  /**
   * The currently selected currency used for the cart and price formatting automatically.
   */
  currency: Currency
  /**
   * Decrement an item in the cart by its index ID.
   * If quantity reaches 0, the item will be removed from the cart.
   */
  decrementItem: (item: DefaultDocumentIDType) => Promise<void>
  /**
   * Increment an item in the cart by its index ID.
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
  paymentMethods: PaymentAdapterClient[]
  /**
   * Remove an item from the cart by its index ID.
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

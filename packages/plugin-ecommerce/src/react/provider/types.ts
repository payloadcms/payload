import type { DefaultDocumentIDType, GeneratedTypes } from 'payload'
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

type TestType = {
  test: GeneratedTypes
}

export type ContextProps = {
  children?: React.ReactNode
  currenciesConfig: CurrenciesConfig
  paymentMethods?: PaymentAdapterClient[]
  /**
   * Whether to enable localStorage for cart persistence.
   * Defaults to true.
   */
  syncLocalStorage?: boolean | SyncLocalStorageConfig
}

export type EcommerceContext = {
  addItem: (item: CartItemClient) => void
  cart: Map<DefaultDocumentIDType, CartItemClient>
  clearCart: () => void
  currency: Currency
  decrementItem: (item: DefaultDocumentIDType) => void
  incrementItem: (item: DefaultDocumentIDType) => void
  initiatePayment: (paymentMethod: string) => Promise<any>
  removeItem: (item: DefaultDocumentIDType) => void
  selectedPaymentMethod?: string
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

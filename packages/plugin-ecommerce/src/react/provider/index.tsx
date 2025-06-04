'use client'
import type { DefaultDocumentIDType } from 'payload'

import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

import type { CartClient, CartItemClient, CurrenciesConfig, Currency } from '../../types.js'
import type { ContextProps, EcommerceContext, SyncLocalStorageConfig } from './types.js'

import { cartReducer } from './reducer.js'

const initialCart = new Map<string, CartItemClient>()

const defaultContext: EcommerceContext = {
  addItem: () => {},
  cart: initialCart,
  clearCart: () => {},
  currency: {
    code: 'USD',
    decimals: 2,
    label: 'US Dollar',
    symbol: '$',
  },
  decrementItem: () => {},
  incrementItem: () => {},
  initiatePayment: async () => {},
  removeItem: () => {},
  selectedPaymentMethod: undefined,
  setCurrency: () => {},
}

const EcommerceContext = createContext<EcommerceContext>(defaultContext)

const defaultLocalStorage = {
  key: 'cart',
}

export const EcommerceProvider: React.FC<ContextProps> = ({
  children,
  currenciesConfig,
  paymentMethods = [],
  syncLocalStorage = true,
}) => {
  const hasRendered = useRef(false)
  const [cart, dispatchCart] = useReducer(
    cartReducer,
    new Map<DefaultDocumentIDType, CartItemClient>(),
  )

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    () =>
      currenciesConfig.supportedCurrencies.find(
        (c) => c.code === currenciesConfig.defaultCurrency,
      )!,
  )

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<null | string>(null)

  const localStorageConfig = useMemo<NonNullable<SyncLocalStorageConfig>>(() => {
    let localStorageConfig: SyncLocalStorageConfig = defaultLocalStorage

    if (syncLocalStorage && typeof syncLocalStorage === 'object') {
      localStorageConfig = {
        ...defaultLocalStorage,
        ...syncLocalStorage,
      }
    }

    return localStorageConfig
  }, [syncLocalStorage])

  const addItem: EcommerceContext['addItem'] = useCallback((item) => {
    dispatchCart({ type: 'ADD_ITEM', payload: item })
  }, [])

  const removeItem: EcommerceContext['removeItem'] = useCallback((targetID) => {
    dispatchCart({ type: 'REMOVE_ITEM', payload: targetID })
  }, [])

  const incrementItem: EcommerceContext['incrementItem'] = useCallback((targetID) => {
    dispatchCart({ type: 'INCREMENT_QUANTITY', payload: targetID })
  }, [])

  const decrementItem: EcommerceContext['decrementItem'] = useCallback((targetID) => {
    dispatchCart({ type: 'DECREMENT_QUANTITY', payload: targetID })
  }, [])

  const clearCart: EcommerceContext['clearCart'] = useCallback(() => {
    dispatchCart({ type: 'CLEAR_CART' })
  }, [])

  const setCurrency: EcommerceContext['setCurrency'] = useCallback(
    (currency) => {
      if (selectedCurrency.code === currency) {
        return
      }

      const foundCurrency = currenciesConfig.supportedCurrencies.find((c) => c.code === currency)
      if (!foundCurrency) {
        throw new Error(`Currency with code "${currency}" not found in config`)
      }

      setSelectedCurrency(foundCurrency)
    },
    [currenciesConfig.supportedCurrencies, selectedCurrency.code],
  )

  const initiatePayment = useCallback(
    async (paymentMethodID: string, paymentData: Record<string, any>) => {
      const paymentMethod = paymentMethods.find((pm) => pm.name === paymentMethodID)

      if (!paymentMethod) {
        throw new Error(`Payment method with ID "${paymentMethodID}" not found`)
      }

      setSelectedPaymentMethod(paymentMethodID)

      if (paymentMethod.initiatePayment) {
        const fetchURL = `/api/payments/${paymentMethodID}/initiate-payment`

        const data = {
          cart: Array.from(cart.values()),
          currency: selectedCurrency.code,
        }

        const response = await fetch(fetchURL, {
          body: JSON.stringify({
            data,
            ...paymentData,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to initiate payment: ${errorText}`)
        }

        const responseData = await response.json()

        if (responseData.error) {
          throw new Error(`Payment initiation error: ${responseData.error}`)
        }
        return responseData
      } else {
        throw new Error(`Payment method "${paymentMethodID}" does not support payment initiation`)
      }
    },
    [cart, paymentMethods, selectedCurrency.code],
  )

  // If localStorage is enabled, we can add logic to persist the cart state
  // NEEDS TO BE DEBOUNCED - IGNORE FOR NOW
  // useEffect(() => {
  //   if (syncLocalStorage && !hasRendered.current) {
  //     const storedCart = localStorage.getItem(localStorageConfig.key!)
  //     if (storedCart) {
  //       const parsedCart: CartClient = JSON.parse(storedCart)

  //       console.log('Restoring cart from localStorage:', {
  //         cart: parsedCart,
  //         key: localStorageConfig.key,
  //       })

  //       if (Array.isArray(parsedCart) && parsedCart.length > 0) {
  //         const cartMap = new Map<DefaultDocumentIDType, CartItemClient>()

  //         for (const item of parsedCart) {
  //           const key = item.variantID || item.productID
  //           if (key) {
  //             cartMap.set(key, item)
  //           }
  //         }
  //         dispatchCart({ type: 'MERGE_CART', payload: Array.from(cartMap.values()) })
  //       }
  //     }

  //     hasRendered.current = true
  //   }
  // }, [localStorageConfig.key, syncLocalStorage])

  // useEffect(() => {
  //   if (syncLocalStorage && hasRendered.current) {
  //     const cartArray = Array.from(cart.values())

  //     console.log('Saving cart to localStorage:', {
  //       cart: cartArray,
  //       key: localStorageConfig.key,
  //     })

  //     localStorage.setItem(localStorageConfig.key!, JSON.stringify(cartArray))
  //   }
  // }, [cart, localStorageConfig.key, syncLocalStorage])

  return (
    <EcommerceContext
      value={
        {
          addItem,
          cart,
          clearCart,
          currency: selectedCurrency,
          decrementItem,
          incrementItem,
          initiatePayment,
          removeItem,
          selectedPaymentMethod,
          setCurrency,
        } as EcommerceContext
      }
    >
      {children}
    </EcommerceContext>
  )
}

export const useEcommerce = () => {
  const context = use(EcommerceContext)

  if (!context) {
    throw new Error('useEcommerce must be used within an EcommerceProvider')
  }

  return context
}

export const useCurrency = () => {
  const { currency, setCurrency } = useEcommerce()

  const formatCurrency = useCallback(
    (value?: null | number): string => {
      if (value === undefined || value === null) {
        return ''
      }

      if (!currency) {
        return value.toString()
      }

      // Convert from base value (e.g., cents) to decimal value (e.g., dollars)
      const decimalValue = value / Math.pow(10, currency.decimals)

      // Format with the correct number of decimal places
      return `${currency.symbol}${decimalValue.toFixed(currency.decimals)}`
    },
    [currency],
  )

  if (!currency) {
    throw new Error('useCurrency must be used within an EcommerceProvider')
  }

  return { currency, formatCurrency, setCurrency }
}

export const useCart = () => {
  const { addItem, cart, clearCart, decrementItem, incrementItem, removeItem } = useEcommerce()

  if (!cart) {
    throw new Error('useCart must be used within an EcommerceProvider')
  }

  return { addItem, cart, clearCart, decrementItem, incrementItem, removeItem }
}

export const usePayments = () => {
  const { initiatePayment, selectedPaymentMethod } = useEcommerce()

  if (!initiatePayment) {
    throw new Error('usePayments must be used within an EcommerceProvider')
  }

  return { initiatePayment, selectedPaymentMethod }
}

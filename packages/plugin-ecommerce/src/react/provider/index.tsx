'use client'
import type { DefaultDocumentIDType } from 'payload'

import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'

import type { CartClient, CartItemClient, Currency } from '../../types.js'
import type { ContextProps, EcommerceContext } from './types.js'

import { cartReducer } from './reducer.js'

const initialCart = new Map<string, CartItemClient>()

const defaultContext: EcommerceContext = {
  addItem: () => {},
  cart: initialCart,
  clearCart: () => {},
  confirmOrder: async () => {},
  currency: {
    code: 'USD',
    decimals: 2,
    label: 'US Dollar',
    symbol: '$',
  },
  decrementItem: () => {},
  incrementItem: () => {},
  initiatePayment: async () => {},
  paymentData: {},
  removeItem: () => {},
  selectedPaymentMethod: undefined,
  setCurrency: () => {},
  subTotal: 0,
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
  const localStorageConfig =
    syncLocalStorage && typeof syncLocalStorage === 'object'
      ? {
          ...defaultLocalStorage,
          ...syncLocalStorage,
        }
      : defaultLocalStorage

  /**
   * The payment data received from the payment initiation process, this is then threaded through to the payment confirmation process.
   * Useful for storing things like payment intent IDs, session IDs, etc.
   */
  const [paymentData, setPaymentData] = useState<EcommerceContext['paymentData']>({})

  const hasRendered = useRef(false)
  const [subTotal, setSubTotal] = useState(0)
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

  const updateSubTotal = useCallback(
    ({ cart }: { cart: EcommerceContext['cart'] }) => {
      let newSubTotal = 0
      const priceField = `priceIn${selectedCurrency.code.toUpperCase()}`

      for (const item of cart.values()) {
        let itemPrice = item.product?.[priceField] || 0

        if (item.variant) {
          itemPrice = item.variant[priceField] || itemPrice
        }

        if (itemPrice > 0) {
          newSubTotal += itemPrice * item.quantity
        }
      }

      setSubTotal(newSubTotal)

      return newSubTotal
    },
    [selectedCurrency],
  )

  useEffect(() => {
    const updatedSubTotal = updateSubTotal({ cart })

    if (syncLocalStorage && hasRendered.current) {
      const cartArray = Array.from(cart.values())

      localStorage.setItem(localStorageConfig.key, JSON.stringify(cartArray))
      localStorage.setItem('subTotal', JSON.stringify(updatedSubTotal))
    }
  }, [cart, localStorageConfig.key, syncLocalStorage, updateSubTotal])

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

  const initiatePayment = useCallback<EcommerceContext['initiatePayment']>(
    async (paymentMethodID, options) => {
      const paymentMethod = paymentMethods.find((pm) => pm.name === paymentMethodID)

      if (!paymentMethod) {
        throw new Error(`Payment method with ID "${paymentMethodID}" not found`)
      }

      setSelectedPaymentMethod(paymentMethodID)

      if (paymentMethod.initiatePayment) {
        const fetchURL = `/api/payments/${paymentMethodID}/initiate`

        const data = {
          cart: Array.from(cart.values()),
          currency: selectedCurrency.code,
        }

        const response = await fetch(fetchURL, {
          body: JSON.stringify({
            ...data,
            ...(options?.additionalData || {}),
          }),
          credentials: 'include',
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

        setPaymentData(responseData)

        return responseData
      } else {
        throw new Error(`Payment method "${paymentMethodID}" does not support payment initiation`)
      }
    },
    [cart, paymentMethods, selectedCurrency.code],
  )

  const confirmOrder = useCallback<EcommerceContext['initiatePayment']>(
    async (paymentMethodID, options) => {
      if (!cart || cart.size === 0) {
        throw new Error(`Cart is empty.`)
      }

      const paymentMethod = paymentMethods.find((pm) => pm.name === paymentMethodID)

      if (!paymentMethod) {
        throw new Error(`Payment method with ID "${paymentMethodID}" not found`)
      }

      if (paymentMethod.confirmOrder) {
        const fetchURL = `/api/payments/${paymentMethodID}/confirm-order`

        const data = {
          cart: Array.from(cart.values()),
          currency: selectedCurrency.code,
          ...paymentData,
        }

        const response = await fetch(fetchURL, {
          body: JSON.stringify({
            ...data,
            ...(options?.additionalData || {}),
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to confirm order: ${errorText}`)
        }

        const responseData = await response.json()

        if (responseData.error) {
          throw new Error(`Order confirmation error: ${responseData.error}`)
        }

        // Clear the payment data
        setPaymentData({})

        return responseData
      } else {
        throw new Error(`Payment method "${paymentMethodID}" does not support order confirmation`)
      }
    },
    [cart, paymentData, paymentMethods, selectedCurrency.code],
  )

  // If localStorage is enabled, we can add logic to persist the cart state
  useEffect(() => {
    if (syncLocalStorage && !hasRendered.current) {
      const storedCart = localStorage.getItem(localStorageConfig.key)
      if (storedCart) {
        const parsedCart: CartClient = JSON.parse(storedCart)

        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          const cartMap = new Map<DefaultDocumentIDType, CartItemClient>()

          for (const item of parsedCart) {
            const key = item.variantID || item.productID
            if (key) {
              cartMap.set(key, item)
            }
          }
          dispatchCart({ type: 'MERGE_CART', payload: parsedCart })
        }
      }

      hasRendered.current = true
    }
  }, [localStorageConfig.key, syncLocalStorage])

  return (
    <EcommerceContext
      value={{
        addItem,
        cart,
        clearCart,
        confirmOrder,
        currency: selectedCurrency,
        decrementItem,
        incrementItem,
        initiatePayment,
        paymentData,
        removeItem,
        selectedPaymentMethod,
        setCurrency,
        subTotal,
      }}
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
    (value?: null | number, options?: { currency?: Currency }): string => {
      if (value === undefined || value === null) {
        return ''
      }

      const currencyToUse = options?.currency || currency

      if (!currencyToUse) {
        return value.toString()
      }

      // Convert from base value (e.g., cents) to decimal value (e.g., dollars)
      const decimalValue = value / Math.pow(10, currencyToUse.decimals)

      // Format with the correct number of decimal places
      return `${currencyToUse.symbol}${decimalValue.toFixed(currencyToUse.decimals)}`
    },
    [currency],
  )

  if (!currency) {
    throw new Error('useCurrency must be used within an EcommerceProvider')
  }

  return { currency, formatCurrency, setCurrency }
}

export const useCart = () => {
  const { addItem, cart, clearCart, decrementItem, incrementItem, removeItem, subTotal } =
    useEcommerce()

  if (!cart) {
    throw new Error('useCart must be used within an EcommerceProvider')
  }

  return { addItem, cart, clearCart, decrementItem, incrementItem, removeItem, subTotal }
}

export const usePayments = () => {
  const { confirmOrder, initiatePayment, paymentData, selectedPaymentMethod } = useEcommerce()

  if (!initiatePayment) {
    throw new Error('usePayments must be used within an EcommerceProvider')
  }

  return { confirmOrder, initiatePayment, paymentData, selectedPaymentMethod }
}

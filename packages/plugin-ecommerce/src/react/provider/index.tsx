'use client'
import type { DefaultDocumentIDType, TypedCollection, TypedUser } from 'payload'

import * as qs from 'qs-esm'
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

import type { CartClient, CartItemClient, Currency } from '../../types.js'
import type { ContextProps, EcommerceContext as EcommerceContextType } from './types.js'

import { cartReducer } from './reducer.js'

const initialCart = ''

const defaultContext: EcommerceContextType = {
  addItem: () => new Promise((resolve) => resolve()),
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

const EcommerceContext = createContext<EcommerceContextType>(defaultContext)

const defaultLocalStorage = {
  key: 'cart',
}

export const EcommerceProvider: React.FC<ContextProps> = ({
  children,
  currenciesConfig = {
    defaultCurrency: 'USD',
    supportedCurrencies: [
      {
        code: 'USD',
        decimals: 2,
        label: 'US Dollar',
        symbol: '$',
      },
    ],
  },
  customersSlug = 'users',
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
  const [paymentData, setPaymentData] = useState<EcommerceContextType['paymentData']>({})

  const [user, setUser] = useState<null | TypedUser>(null)

  const hasRendered = useRef(false)

  /**
   * The ID of the cart associated with the current session.
   * This is used to identify the cart in the database or local storage.
   * It can be null if no cart has been created yet.
   */
  const [cartID, setCartID] = useState<DefaultDocumentIDType>()
  const [cart, setCart] = useState<TypedCollection['carts']>()

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    () =>
      currenciesConfig.supportedCurrencies.find(
        (c) => c.code === currenciesConfig.defaultCurrency,
      )!,
  )

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<null | string>(null)

  const cartQuery = useMemo(() => {
    const priceField = `priceIn${selectedCurrency.code}`

    return {
      depth: 2,
      populate: {
        products: {
          slug: true,
          [priceField]: true,
          title: true,
        },
        variants: {
          [priceField]: true,
          title: true,
        },
      },
      select: {
        items: true,
        subtotal: true,
      },
    }
  }, [selectedCurrency.code])

  const createCart = useCallback(
    async (initialData: Record<string, unknown>) => {
      const query = qs.stringify(cartQuery)

      const response = await fetch(`/api/carts?${query}`, {
        body: JSON.stringify({
          ...initialData,
          currency: selectedCurrency.code,
          customer: user?.id,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create cart: ${errorText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`Cart creation error: ${data.error}`)
      }

      return data.doc as TypedCollection['carts']
    },
    [cartQuery, selectedCurrency.code, user?.id],
  )

  const getCart = useCallback(
    async (cartID: DefaultDocumentIDType) => {
      const query = qs.stringify(cartQuery)

      const response = await fetch(`/api/carts/${cartID}?${query}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch cart: ${errorText}`)
      }
      const data = await response.json()
      if (data.error) {
        throw new Error(`Cart fetch error: ${data.error}`)
      }

      return data as TypedCollection['carts']
    },
    [cartQuery],
  )

  const updateCart = useCallback(
    async (cartID: DefaultDocumentIDType, data: Partial<TypedCollection['carts']>) => {
      const query = qs.stringify(cartQuery)

      const response = await fetch(`/api/carts/${cartID}?${query}`, {
        body: JSON.stringify(data),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update cart: ${errorText}`)
      }

      const updatedCart = await response.json()
      setCart(updatedCart.doc as TypedCollection['carts'])
    },
    [cartQuery],
  )

  useEffect(() => {
    if (hasRendered.current) {
      if (syncLocalStorage && cartID) {
        localStorage.setItem(localStorageConfig.key, cartID as string)
      }
    }
  }, [cartID, localStorageConfig.key, syncLocalStorage])

  const addItem: EcommerceContextType['addItem'] = useCallback(
    async (item, quantity = 1) => {
      if (cartID) {
        const existingCart = await getCart(cartID)

        if (!existingCart) {
          // console.error(`Cart with ID "${cartID}" not found`)

          setCartID(undefined)
          setCart(undefined)
          return
        }

        // Check if the item already exists in the cart
        const existingItemIndex = existingCart.items.findIndex((cartItem) => {
          const productID =
            typeof cartItem.product === 'object' ? cartItem.product.id : item.product
          const variantID =
            cartItem.variant && typeof cartItem.variant === 'object'
              ? cartItem.variant.id
              : item.variant

          return (
            productID === item.product &&
            (item.variant && variantID ? variantID === item.variant : true)
          )
        })

        let updatedItems = [...existingCart.items]
        if (existingItemIndex !== -1) {
          // If the item exists, update its quantity
          updatedItems[existingItemIndex].quantity =
            updatedItems[existingItemIndex].quantity + quantity

          // Update the cart with the new items
          await updateCart(cartID, {
            items: updatedItems,
          })
        } else {
          // If the item does not exist, add it to the cart
          updatedItems = [...existingCart.items, { ...item, quantity }]
        }

        // Update the cart with the new items
        await updateCart(cartID, {
          items: updatedItems,
        })
      } else {
        // If no cartID exists, create a new cart
        const newCart = await createCart({ items: [{ ...item, quantity }] })

        setCartID(newCart.id)
        setCart(newCart)
      }
    },
    [cartID, createCart, getCart, updateCart],
  )

  const removeItem: EcommerceContextType['removeItem'] = useCallback(
    async (targetID) => {
      if (!cartID) {
        return
      }

      const existingCart = await getCart(cartID)

      if (!existingCart) {
        // console.error(`Cart with ID "${cartID}" not found`)
        setCartID(undefined)
        setCart(undefined)
        return
      }

      // Check if the item already exists in the cart
      const existingItemIndex = existingCart.items.findIndex((cartItem) => cartItem.id === targetID)

      if (existingItemIndex !== -1) {
        // If the item exists, remove it from the cart
        const updatedItems = [...existingCart.items]
        updatedItems.splice(existingItemIndex, 1)

        // Update the cart with the new items
        await updateCart(cartID, {
          items: updatedItems,
        })
      }
    },
    [cartID, getCart, updateCart],
  )

  const incrementItem: EcommerceContextType['incrementItem'] = useCallback(
    async (targetID) => {
      if (!cartID) {
        return
      }

      const existingCart = await getCart(cartID)

      if (!existingCart) {
        // console.error(`Cart with ID "${cartID}" not found`)
        setCartID(undefined)
        setCart(undefined)
        return
      }

      // Check if the item already exists in the cart
      const existingItemIndex = existingCart.items.findIndex((cartItem) => cartItem.id === targetID)

      let updatedItems = [...existingCart.items]

      if (existingItemIndex !== -1) {
        // If the item exists, increment its quantity
        updatedItems[existingItemIndex].quantity = updatedItems[existingItemIndex].quantity + 1 // Increment by 1
        // Update the cart with the new items
        await updateCart(cartID, {
          items: updatedItems,
        })
      } else {
        // If the item does not exist, add it to the cart with quantity 1
        updatedItems = [...existingCart.items, { product: targetID, quantity: 1 }]
        // Update the cart with the new items
        await updateCart(cartID, {
          items: updatedItems,
        })
      }
    },
    [cartID, getCart, updateCart],
  )

  const decrementItem: EcommerceContextType['decrementItem'] = useCallback(
    async (targetID) => {
      if (!cartID) {
        return
      }

      const existingCart = await getCart(cartID)

      if (!existingCart) {
        // console.error(`Cart with ID "${cartID}" not found`)
        setCartID(undefined)
        setCart(undefined)
        return
      }

      // Check if the item already exists in the cart
      const existingItemIndex = existingCart.items.findIndex((cartItem) => cartItem.id === targetID)

      const updatedItems = [...existingCart.items]

      if (existingItemIndex !== -1) {
        // If the item exists, decrement its quantity
        updatedItems[existingItemIndex].quantity = updatedItems[existingItemIndex].quantity - 1 // Decrement by 1

        // If the quantity reaches 0, remove the item from the cart
        if (updatedItems[existingItemIndex].quantity <= 0) {
          updatedItems.splice(existingItemIndex, 1)
        }

        // Update the cart with the new items
        await updateCart(cartID, {
          items: updatedItems,
        })
      }
    },
    [cartID, getCart, updateCart],
  )

  const clearCart: EcommerceContextType['clearCart'] = useCallback(async () => {
    // dispatchCart({ type: 'CLEAR_CART' })
  }, [])

  const setCurrency: EcommerceContextType['setCurrency'] = useCallback(
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

  const initiatePayment = useCallback<EcommerceContextType['initiatePayment']>(
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

  const confirmOrder = useCallback<EcommerceContextType['initiatePayment']>(
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

  const getUser = useCallback(async () => {
    try {
      const query = qs.stringify({
        depth: 0,
        select: {
          id: true,
        },
      })

      const response = await fetch(`/api/users/me?${query}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch user: ${errorText}`)
      }
      const userData = await response.json()
      if (userData.error) {
        throw new Error(`User fetch error: ${userData.error}`)
      }

      if (userData.user) {
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    }
  }, [])

  // If localStorage is enabled, we can add logic to persist the cart state
  useEffect(() => {
    if (!hasRendered.current) {
      if (syncLocalStorage) {
        const storedCart = localStorage.getItem(localStorageConfig.key)
        if (storedCart) {
          getCart(storedCart)
            .then((fetchedCart) => {
              console.log('Fetched cart from localStorage:', fetchedCart)
              setCart(fetchedCart)
              setCartID(storedCart as DefaultDocumentIDType)
            })
            .catch((error) => {
              // console.error('Error fetching cart from localStorage:', error)
              // If there's an error fetching the cart, we can clear it from localStorage
              localStorage.removeItem(localStorageConfig.key)
              // setCartID(undefined)
              // setCart(undefined)
            })
        }
      }

      void getUser()

      hasRendered.current = true
    }
  }, [getCart, getUser, localStorageConfig.key, syncLocalStorage])

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
      }}
    >
      {children}
    </EcommerceContext>
  )
}

export const useEcommerce = () => {
  const context = use<EcommerceContextType<any>>(EcommerceContext)

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
  const { addItem, cart, clearCart, decrementItem, incrementItem, removeItem } = useEcommerce()

  if (!addItem) {
    throw new Error('useCart must be used within an EcommerceProvider')
  }

  return { addItem, cart, clearCart, decrementItem, incrementItem, removeItem }
}

export const usePayments = () => {
  const { confirmOrder, initiatePayment, paymentData, selectedPaymentMethod } = useEcommerce()

  if (!initiatePayment) {
    throw new Error('usePayments must be used within an EcommerceProvider')
  }

  return { confirmOrder, initiatePayment, paymentData, selectedPaymentMethod }
}

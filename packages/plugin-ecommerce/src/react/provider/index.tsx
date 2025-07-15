'use client'
import { type DefaultDocumentIDType, type TypedCollection, type TypedUser } from 'payload'
import { deepMergeSimple } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CartItem, Currency } from '../../types.js'
import type { ContextProps, EcommerceContext as EcommerceContextType } from './types.js'

const defaultContext: EcommerceContextType = {
  addItem: async () => {},
  clearCart: async () => {},
  confirmOrder: async () => {},
  currenciesConfig: {
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
  currency: {
    code: 'USD',
    decimals: 2,
    label: 'US Dollar',
    symbol: '$',
  },
  decrementItem: async () => {},
  incrementItem: async () => {},
  initiatePayment: async () => {},
  paymentMethods: [],
  removeItem: async () => {},
  setCurrency: () => {},
}

const EcommerceContext = createContext<EcommerceContextType>(defaultContext)

const defaultLocalStorage = {
  key: 'cart',
}

export const EcommerceProvider: React.FC<ContextProps> = ({
  api,
  cartsSlug = 'carts',
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

  const { apiRoute = '/api', cartsFetchQuery = {}, serverURL = '' } = api || {}

  /**
   * The payment data received from the payment initiation process, this is then threaded through to the payment confirmation process.
   * Useful for storing things like payment intent IDs, session IDs, etc.
   */
  const [paymentData, setPaymentData] = useState<EcommerceContextType['paymentData']>()

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

    const baseQuery = {
      depth: 0,
      populate: {
        products: {
          [priceField]: true,
        },
        variants: {
          options: true,
          [priceField]: true,
        },
      },
      select: {
        items: true,
        subtotal: true,
      },
    }

    return deepMergeSimple(baseQuery, cartsFetchQuery)
  }, [selectedCurrency.code, cartsFetchQuery])

  const createCart = useCallback(
    async (initialData: Record<string, unknown>) => {
      const query = qs.stringify(cartQuery)

      const response = await fetch(`/api/${cartsSlug}?${query}`, {
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
    [cartQuery, cartsSlug, selectedCurrency.code, user?.id],
  )

  const getCart = useCallback(
    async (cartID: DefaultDocumentIDType) => {
      const query = qs.stringify(cartQuery)

      const response = await fetch(`/api/${cartsSlug}/${cartID}?${query}`, {
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
    [cartQuery, cartsSlug],
  )

  const updateCart = useCallback(
    async (cartID: DefaultDocumentIDType, data: Partial<TypedCollection['carts']>) => {
      const query = qs.stringify(cartQuery)

      const response = await fetch(`/api/${cartsSlug}/${cartID}?${query}`, {
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
    [cartQuery, cartsSlug],
  )

  const deleteCart = useCallback(
    async (cartID: DefaultDocumentIDType) => {
      const response = await fetch(`/api/${cartsSlug}/${cartID}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update cart: ${errorText}`)
      }

      setCart(undefined)
      setCartID(undefined)
    },
    [cartsSlug],
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
        const existingItemIndex = existingCart.items.findIndex((cartItem: CartItem) => {
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
      const existingItemIndex = existingCart.items.findIndex(
        (cartItem: CartItem) => cartItem.id === targetID,
      )

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
      const existingItemIndex = existingCart.items.findIndex(
        (cartItem: CartItem) => cartItem.id === targetID,
      )

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
      const existingItemIndex = existingCart.items.findIndex(
        (cartItem: CartItem) => cartItem.id === targetID,
      )

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
    if (cartID) {
      await deleteCart(cartID)
    }
  }, [cartID, deleteCart])

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
      const paymentMethod = paymentMethods.find((method) => method.name === paymentMethodID)

      if (!paymentMethod) {
        throw new Error(`Payment method with ID "${paymentMethodID}" not found`)
      }

      if (!cartID) {
        throw new Error(`No cart is provided.`)
      }

      setSelectedPaymentMethod(paymentMethodID)

      if (paymentMethod.initiatePayment) {
        const fetchURL = `/api/payments/${paymentMethodID}/initiate`

        const data = {
          cartID,
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
    [cartID, paymentMethods, selectedCurrency.code],
  )

  const confirmOrder = useCallback<EcommerceContextType['initiatePayment']>(
    async (paymentMethodID, options) => {
      if (!cartID) {
        throw new Error(`Cart is empty.`)
      }

      const paymentMethod = paymentMethods.find((pm) => pm.name === paymentMethodID)

      if (!paymentMethod) {
        throw new Error(`Payment method with ID "${paymentMethodID}" not found`)
      }

      if (paymentMethod.confirmOrder) {
        const fetchURL = `/api/payments/${paymentMethodID}/confirm-order`

        const data = {
          cartID,
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
    [cartID, paymentData, paymentMethods, selectedCurrency.code],
  )

  const getUser = useCallback(async () => {
    try {
      const query = qs.stringify({
        depth: 0,
        select: {
          id: true,
          carts: true,
        },
      })

      const response = await fetch(`/api/${customersSlug}/me?${query}`, {
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
        setUser(userData.user as TypedUser)
        return userData.user as TypedUser
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    }
  }, [customersSlug])

  // If localStorage is enabled, we can add logic to persist the cart state
  useEffect(() => {
    if (!hasRendered.current) {
      if (syncLocalStorage) {
        const storedCart = localStorage.getItem(localStorageConfig.key)
        if (storedCart) {
          getCart(storedCart)
            .then((fetchedCart) => {
              setCart(fetchedCart)
              setCartID(storedCart as DefaultDocumentIDType)
            })
            .catch((error) => {
              // console.error('Error fetching cart from localStorage:', error)
              // If there's an error fetching the cart, we can clear it from localStorage
              localStorage.removeItem(localStorageConfig.key)
              setCartID(undefined)
              setCart(undefined)
            })
        }
      }

      hasRendered.current = true

      void getUser().then((user) => {
        if (user && user.cart?.docs && user.cart.docs.length > 0) {
          // If the user has carts, we can set the cartID to the first cart
          const cartID =
            typeof user.cart.docs[0] === 'object' ? user.cart.docs[0].id : user.cart.docs[0]

          if (cartID) {
            getCart(cartID)
              .then((fetchedCart) => {
                setCart(fetchedCart)
                setCartID(cartID)
              })
              .catch((error) => {
                // console.error('Error fetching user cart:', error)
                setCart(undefined)
                setCartID(undefined)
              })
          }
        }
      })
    }
  }, [getCart, getUser, localStorageConfig.key, syncLocalStorage])

  return (
    <EcommerceContext
      value={{
        addItem,
        cart,
        clearCart,
        confirmOrder,
        currenciesConfig,
        currency: selectedCurrency,
        decrementItem,
        incrementItem,
        initiatePayment,
        paymentData,
        paymentMethods,
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
  const context = use(EcommerceContext)

  if (!context) {
    throw new Error('useEcommerce must be used within an EcommerceProvider')
  }

  return context
}

export const useCurrency = () => {
  const { currenciesConfig, currency, setCurrency } = useEcommerce()

  const formatCurrency = useCallback(
    (value?: null | number, options?: { currency?: Currency }): string => {
      if (value === undefined || value === null) {
        return ''
      }

      const currencyToUse = options?.currency || currency

      if (!currencyToUse) {
        return value.toString()
      }

      if (value === 0) {
        return `${currencyToUse.symbol}0.${'0'.repeat(currencyToUse.decimals)}`
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

  return {
    currency,
    formatCurrency,
    setCurrency,
    supportedCurrencies: currenciesConfig.supportedCurrencies,
  }
}

export const useCart = () => {
  const { addItem, cart, clearCart, decrementItem, incrementItem, removeItem } = useEcommerce()

  if (!addItem) {
    throw new Error('useCart must be used within an EcommerceProvider')
  }

  return { addItem, cart, clearCart, decrementItem, incrementItem, removeItem }
}

export const usePayments = () => {
  const { confirmOrder, initiatePayment, paymentData, paymentMethods, selectedPaymentMethod } =
    useEcommerce()

  if (!initiatePayment) {
    throw new Error('usePayments must be used within an EcommerceProvider')
  }

  return { confirmOrder, initiatePayment, paymentData, paymentMethods, selectedPaymentMethod }
}

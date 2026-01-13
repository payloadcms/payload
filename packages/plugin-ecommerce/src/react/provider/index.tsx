'use client'
import type { DefaultDocumentIDType, TypedUser } from 'payload'

import { deepMergeSimple, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  AddressesCollection,
  CartsCollection,
  ContextProps,
  Currency,
  EcommerceConfig,
  EcommerceContextType,
} from '../../types/index.js'

const defaultContext: EcommerceContextType = {
  addItem: async () => {},
  clearCart: async () => {},
  clearSession: () => {},
  config: {
    addressesSlug: 'addresses',
    api: {
      apiRoute: '/api',
    },
    cartsSlug: 'carts',
    customersSlug: 'users',
  },
  confirmOrder: async () => {},
  createAddress: async () => {},
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
  isLoading: false,
  paymentMethods: [],
  refreshCart: async () => {},
  removeItem: async () => {},
  setCurrency: () => {},
  updateAddress: async () => {},
  user: null,
}

const EcommerceContext = createContext<EcommerceContextType>(defaultContext)

const defaultLocalStorage = {
  key: 'cart',
}

export const EcommerceProvider: React.FC<ContextProps> = ({
  addressesSlug = 'addresses',
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
  debug = false,
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

  const { apiRoute = '/api', cartsFetchQuery = {} } = api || {}
  const baseAPIURL = formatAdminURL({
    apiRoute,
    path: '',
  })

  const config = useMemo<EcommerceConfig>(
    () => ({
      addressesSlug,
      api: {
        apiRoute,
      },
      cartsSlug,
      customersSlug,
    }),
    [addressesSlug, apiRoute, cartsSlug, customersSlug],
  )

  const [isLoading, setIsLoading] = useState(false)

  const [user, setUser] = useState<null | TypedUser>(null)

  const [addresses, setAddresses] = useState<AddressesCollection[]>()

  const hasRendered = useRef(false)

  /**
   * The ID of the cart associated with the current session.
   * This is used to identify the cart in the database or local storage.
   * It can be null if no cart has been created yet.
   */
  const [cartID, setCartID] = useState<DefaultDocumentIDType>()
  /**
   * The secret for accessing guest carts without authentication.
   * This is generated when a guest user creates a cart.
   */
  const [cartSecret, setCartSecret] = useState<string | undefined>(undefined)
  const [cart, setCart] = useState<CartsCollection>()

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

      const response = await fetch(`${baseAPIURL}/${cartsSlug}?${query}`, {
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

      // Store the secret for guest cart access
      if (!user && data.doc?.secret) {
        setCartSecret(data.doc.secret)
      }

      return data.doc as CartsCollection
    },
    [baseAPIURL, cartQuery, cartsSlug, selectedCurrency.code, user],
  )

  const getCart = useCallback(
    async (cartID: DefaultDocumentIDType, options?: { secret?: string }) => {
      const query = qs.stringify({
        ...cartQuery,
        ...(options?.secret ? { secret: options.secret } : {}),
      })

      const response = await fetch(`${baseAPIURL}/${cartsSlug}/${cartID}?${query}`, {
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

      return data as CartsCollection
    },
    [baseAPIURL, cartQuery, cartsSlug],
  )

  const refreshCart = useCallback<EcommerceContextType['refreshCart']>(async () => {
    if (!cartID) {
      return
    }
    const updatedCart = await getCart(cartID)
    setCart(updatedCart)
  }, [cartID, getCart])

  // Persist cart ID and secret to localStorage
  useEffect(() => {
    if (hasRendered.current) {
      if (syncLocalStorage) {
        if (cartID) {
          localStorage.setItem(localStorageConfig.key, cartID as string)
        } else {
          localStorage.removeItem(localStorageConfig.key)
        }

        if (cartSecret) {
          localStorage.setItem(`${localStorageConfig.key}_secret`, cartSecret)
        } else {
          localStorage.removeItem(`${localStorageConfig.key}_secret`)
        }
      }
    }
  }, [cartID, cartSecret, localStorageConfig.key, syncLocalStorage])

  const addItem: EcommerceContextType['addItem'] = useCallback(
    async (item, quantity = 1) => {
      setIsLoading(true)
      try {
        if (cartID) {
          // Use server-side endpoint for adding items
          const response = await fetch(`${baseAPIURL}/${cartsSlug}/${cartID}/add-item`, {
            body: JSON.stringify({
              item,
              quantity,
              secret: cartSecret,
            }),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to add item: ${errorText}`)
          }

          const result = await response.json()

          if (!result.success) {
            // Cart not found - reset state
            setCartID(undefined)
            setCart(undefined)
            setCartSecret(undefined)
            return
          }

          // Use the cart returned from the endpoint directly
          setCart(result.cart as CartsCollection)
        } else {
          // If no cartID exists, create a new cart with the item
          const newCart = await createCart({ items: [{ ...item, quantity }] })

          setCartID(newCart.id)
          setCart(newCart)
        }
      } catch (error) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.error('Error adding item to cart:', error)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [baseAPIURL, cartID, cartSecret, cartsSlug, createCart, debug],
  )

  const removeItem: EcommerceContextType['removeItem'] = useCallback(
    async (targetID) => {
      if (!cartID) {
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`${baseAPIURL}/${cartsSlug}/${cartID}/remove-item`, {
          body: JSON.stringify({
            itemID: targetID,
            secret: cartSecret,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to remove item: ${errorText}`)
        }

        const result = await response.json()

        if (!result.success) {
          // Cart not found - reset state
          setCartID(undefined)
          setCart(undefined)
          setCartSecret(undefined)
          return
        }

        // Use the cart returned from the endpoint directly
        setCart(result.cart as CartsCollection)
      } catch (error) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.error('Error removing item from cart:', error)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [baseAPIURL, cartID, cartSecret, cartsSlug, debug],
  )

  const incrementItem: EcommerceContextType['incrementItem'] = useCallback(
    async (targetID) => {
      if (!cartID) {
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`${baseAPIURL}/${cartsSlug}/${cartID}/update-item`, {
          body: JSON.stringify({
            itemID: targetID,
            quantity: { $inc: 1 },
            secret: cartSecret,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to increment item: ${errorText}`)
        }

        const result = await response.json()

        if (!result.success) {
          // Cart not found - reset state
          setCartID(undefined)
          setCart(undefined)
          setCartSecret(undefined)
          return
        }

        // Use the cart returned from the endpoint directly
        setCart(result.cart as CartsCollection)
      } catch (error) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.error('Error incrementing item quantity:', error)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [baseAPIURL, cartID, cartSecret, cartsSlug, debug],
  )

  const decrementItem: EcommerceContextType['decrementItem'] = useCallback(
    async (targetID) => {
      if (!cartID) {
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`${baseAPIURL}/${cartsSlug}/${cartID}/update-item`, {
          body: JSON.stringify({
            itemID: targetID,
            quantity: { $inc: -1 },
            secret: cartSecret,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to decrement item: ${errorText}`)
        }

        const result = await response.json()

        if (!result.success) {
          // Cart not found - reset state
          setCartID(undefined)
          setCart(undefined)
          setCartSecret(undefined)
          return
        }

        // Use the cart returned from the endpoint directly
        setCart(result.cart as CartsCollection)
      } catch (error) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.error('Error decrementing item quantity:', error)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [baseAPIURL, cartID, cartSecret, cartsSlug, debug],
  )

  const clearCart: EcommerceContextType['clearCart'] = useCallback(async () => {
    if (!cartID) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${baseAPIURL}/${cartsSlug}/${cartID}/clear`, {
        body: JSON.stringify({
          secret: cartSecret,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to clear cart: ${errorText}`)
      }

      const result = await response.json()

      if (!result.success) {
        // Cart not found - reset state
        setCartID(undefined)
        setCart(undefined)
        setCartSecret(undefined)
        return
      }

      // Use the cart returned from the endpoint directly
      setCart(result.cart as CartsCollection)
    } catch (error) {
      if (debug) {
        // eslint-disable-next-line no-console
        console.error('Error clearing cart:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [baseAPIURL, cartID, cartSecret, cartsSlug, debug])

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
        try {
          const response = await fetch(`${baseAPIURL}/payments/${paymentMethodID}/initiate`, {
            body: JSON.stringify({
              cartID,
              currency: selectedCurrency.code,
              secret: cartSecret,
              ...(options?.additionalData || {}),
            }),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          if (!response.ok) {
            const responseError = await response.text()
            throw new Error(responseError)
          }

          const responseData = await response.json()

          if (responseData.error) {
            throw new Error(responseData.error)
          }

          return responseData
        } catch (error) {
          if (debug) {
            // eslint-disable-next-line no-console
            console.error('Error initiating payment:', error)
          }
          throw new Error(error instanceof Error ? error.message : 'Failed to initiate payment')
        }
      } else {
        throw new Error(`Payment method "${paymentMethodID}" does not support payment initiation`)
      }
    },
    [baseAPIURL, cartID, cartSecret, debug, paymentMethods, selectedCurrency.code],
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
        const response = await fetch(`${baseAPIURL}/payments/${paymentMethodID}/confirm-order`, {
          body: JSON.stringify({
            cartID,
            currency: selectedCurrency.code,
            secret: cartSecret,
            ...(options?.additionalData || {}),
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          const responseError = await response.text()
          throw new Error(responseError)
        }

        const responseData = await response.json()

        if (responseData.error) {
          throw new Error(responseData.error)
        }

        return responseData
      } else {
        throw new Error(`Payment method "${paymentMethodID}" does not support order confirmation`)
      }
    },
    [baseAPIURL, cartID, cartSecret, paymentMethods, selectedCurrency.code],
  )

  const getUser = useCallback(async () => {
    try {
      const query = qs.stringify({
        depth: 0,
        select: {
          id: true,
          cart: true,
        },
      })

      const response = await fetch(`${baseAPIURL}/${customersSlug}/me?${query}`, {
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
      if (debug) {
        // eslint-disable-next-line no-console
        console.error('Error fetching user:', error)
      }
      setUser(null)
      throw new Error(
        `Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }, [baseAPIURL, customersSlug, debug])

  const getAddresses = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      const query = qs.stringify({
        depth: 0,
        limit: 0,
        pagination: false,
      })

      const response = await fetch(`${baseAPIURL}/${addressesSlug}?${query}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()

        throw new Error(errorText)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`Address fetch error: ${data.error}`)
      }

      if (data.docs && data.docs.length > 0) {
        setAddresses(data.docs)
      }
    } catch (error) {
      if (debug) {
        // eslint-disable-next-line no-console
        console.error('Error fetching addresses:', error)
      }
      setAddresses(undefined)
      throw new Error(
        `Failed to fetch addresses: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }, [user, baseAPIURL, addressesSlug, debug])

  const updateAddress = useCallback<EcommerceContextType['updateAddress']>(
    async (addressID, address) => {
      if (!user) {
        throw new Error('User must be logged in to update or create an address')
      }

      try {
        const response = await fetch(`${baseAPIURL}/${addressesSlug}/${addressID}`, {
          body: JSON.stringify(address),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to update or create address: ${errorText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(`Address update/create error: ${data.error}`)
        }

        // Refresh addresses after updating or creating
        await getAddresses()
      } catch (error) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.error('Error updating or creating address:', error)
        }

        throw new Error(
          `Failed to update or create address: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },
    [user, baseAPIURL, addressesSlug, getAddresses, debug],
  )

  const createAddress = useCallback<EcommerceContextType['createAddress']>(
    async (address) => {
      if (!user) {
        throw new Error('User must be logged in to update or create an address')
      }

      try {
        const response = await fetch(`${baseAPIURL}/${addressesSlug}`, {
          body: JSON.stringify(address),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to update or create address: ${errorText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(`Address update/create error: ${data.error}`)
        }

        // Refresh addresses after updating or creating
        await getAddresses()
      } catch (error) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.error('Error updating or creating address:', error)
        }

        throw new Error(
          `Failed to update or create address: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },
    [user, baseAPIURL, addressesSlug, getAddresses, debug],
  )

  /**
   * Clears all ecommerce session data from state and localStorage.
   * Used during logout to ensure no user data persists.
   */
  const clearSession = useCallback(() => {
    setCart(undefined)
    setCartID(undefined)
    setCartSecret(undefined)
    setAddresses(undefined)
    setUser(null)

    if (syncLocalStorage) {
      localStorage.removeItem(localStorageConfig.key)
      localStorage.removeItem(`${localStorageConfig.key}_secret`)
    }
  }, [localStorageConfig.key, syncLocalStorage])

  // If localStorage is enabled, restore cart from storage
  useEffect(() => {
    if (!hasRendered.current) {
      if (syncLocalStorage) {
        const storedCartID = localStorage.getItem(localStorageConfig.key)
        const storedSecret = localStorage.getItem(`${localStorageConfig.key}_secret`)

        if (storedCartID) {
          getCart(storedCartID, { secret: storedSecret || undefined })
            .then((fetchedCart) => {
              setCart(fetchedCart)
              setCartID(storedCartID as DefaultDocumentIDType)
              if (storedSecret) {
                setCartSecret(storedSecret)
              }
            })
            .catch((_) => {
              // console.error('Error fetching cart from localStorage:', error)
              // If there's an error fetching the cart, clear it from localStorage
              localStorage.removeItem(localStorageConfig.key)
              localStorage.removeItem(`${localStorageConfig.key}_secret`)
              setCartID(undefined)
              setCart(undefined)
              setCartSecret(undefined)
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
                if (debug) {
                  // eslint-disable-next-line no-console
                  console.error('Error fetching user cart:', error)
                }

                setCart(undefined)
                setCartID(undefined)

                throw new Error(`Failed to fetch user cart: ${error.message}`)
              })
          }
        }
      })
    }
  }, [debug, getAddresses, getCart, getUser, localStorageConfig.key, syncLocalStorage])

  useEffect(() => {
    if (user) {
      // If the user is logged in, fetch their addresses
      void getAddresses()
    } else {
      // If no user is logged in, clear addresses
      setAddresses(undefined)
    }
  }, [getAddresses, user])

  return (
    <EcommerceContext
      value={{
        addItem,
        addresses,
        cart,
        clearCart,
        clearSession,
        config,
        confirmOrder,
        createAddress,
        currenciesConfig,
        currency: selectedCurrency,
        decrementItem,
        incrementItem,
        initiatePayment,
        isLoading,
        paymentMethods,
        refreshCart,
        removeItem,
        selectedPaymentMethod,
        setCurrency,
        updateAddress,
        user,
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

export const useEcommerceConfig = () => {
  const { config } = useEcommerce()

  return config
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

export function useCart<T extends CartsCollection>() {
  const {
    addItem,
    cart,
    clearCart,
    decrementItem,
    incrementItem,
    isLoading,
    refreshCart,
    removeItem,
  } = useEcommerce()

  if (!addItem) {
    throw new Error('useCart must be used within an EcommerceProvider')
  }

  return {
    addItem,
    cart: cart as T,
    clearCart,
    decrementItem,
    incrementItem,
    isLoading,
    refreshCart,
    removeItem,
  }
}

export const usePayments = () => {
  const { confirmOrder, initiatePayment, isLoading, paymentMethods, selectedPaymentMethod } =
    useEcommerce()

  if (!initiatePayment) {
    throw new Error('usePayments must be used within an EcommerceProvider')
  }

  return { confirmOrder, initiatePayment, isLoading, paymentMethods, selectedPaymentMethod }
}

export function useAddresses<T extends AddressesCollection>() {
  const { addresses, createAddress, isLoading, updateAddress } = useEcommerce()

  if (!createAddress) {
    throw new Error('usePayments must be used within an EcommerceProvider')
  }

  return { addresses: addresses as T[], createAddress, isLoading, updateAddress }
}

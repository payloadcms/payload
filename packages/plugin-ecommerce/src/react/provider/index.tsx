'use client'
import type { DefaultDocumentIDType, TypedUser } from 'payload'

import { deepMergeSimple } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  AddressesCollection,
  CartItem,
  CartsCollection,
  ContextProps,
  Currency,
  EcommerceContextType,
} from '../../types/index.js'

const defaultContext: EcommerceContextType = {
  addItem: async () => {},
  clearCart: async () => {},
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
  paymentMethods: [],
  removeItem: async () => {},
  setCurrency: () => {},
  updateAddress: async () => {},
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

  const { apiRoute = '/api', cartsFetchQuery = {}, serverURL = '' } = api || {}
  const baseAPIURL = `${serverURL}${apiRoute}`

  const [user, setUser] = useState<null | TypedUser>(null)

  const [addresses, setAddresses] = useState<AddressesCollection[]>()

  const hasRendered = useRef(false)

  /**
   * The ID of the cart associated with the current session.
   * This is used to identify the cart in the database or local storage.
   * It can be null if no cart has been created yet.
   */
  const [cartID, setCartID] = useState<DefaultDocumentIDType>()
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

      return data.doc as CartsCollection
    },
    [baseAPIURL, cartQuery, cartsSlug, selectedCurrency.code, user?.id],
  )

  const getCart = useCallback(
    async (cartID: DefaultDocumentIDType) => {
      const query = qs.stringify(cartQuery)

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

  const updateCart = useCallback(
    async (cartID: DefaultDocumentIDType, data: Partial<CartsCollection>) => {
      const query = qs.stringify(cartQuery)

      const response = await fetch(`${baseAPIURL}/${cartsSlug}/${cartID}?${query}`, {
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

      setCart(updatedCart.doc as CartsCollection)
    },
    [baseAPIURL, cartQuery, cartsSlug],
  )

  const deleteCart = useCallback(
    async (cartID: DefaultDocumentIDType) => {
      const response = await fetch(`${baseAPIURL}/${cartsSlug}/${cartID}`, {
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
    [baseAPIURL, cartsSlug],
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
        const existingItemIndex =
          existingCart.items?.findIndex((cartItem: CartItem) => {
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
          }) ?? -1

        let updatedItems = existingCart.items ? [...existingCart.items] : []

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
          updatedItems = [...(existingCart.items ?? []), { ...item, quantity }]
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
      const existingItemIndex =
        existingCart.items?.findIndex((cartItem: CartItem) => cartItem.id === targetID) ?? -1

      if (existingItemIndex !== -1) {
        // If the item exists, remove it from the cart
        const updatedItems = existingCart.items ? [...existingCart.items] : []
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
      const existingItemIndex =
        existingCart.items?.findIndex((cartItem: CartItem) => cartItem.id === targetID) ?? -1

      let updatedItems = existingCart.items ? [...existingCart.items] : []

      if (existingItemIndex !== -1) {
        // If the item exists, increment its quantity
        updatedItems[existingItemIndex].quantity = updatedItems[existingItemIndex].quantity + 1 // Increment by 1
        // Update the cart with the new items
        await updateCart(cartID, {
          items: updatedItems,
        })
      } else {
        // If the item does not exist, add it to the cart with quantity 1
        updatedItems = [...(existingCart.items ?? []), { product: targetID, quantity: 1 }]
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
      const existingItemIndex =
        existingCart.items?.findIndex((cartItem: CartItem) => cartItem.id === targetID) ?? -1

      const updatedItems = existingCart.items ? [...existingCart.items] : []

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
        const fetchURL = `${baseAPIURL}/payments/${paymentMethodID}/initiate`

        const data = {
          cartID,
          currency: selectedCurrency.code,
        }

        try {
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
    [baseAPIURL, cartID, debug, paymentMethods, selectedCurrency.code],
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
        const fetchURL = `${baseAPIURL}/payments/${paymentMethodID}/confirm-order`

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
    [baseAPIURL, cartID, paymentMethods, selectedCurrency.code],
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
            .catch((_) => {
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
        confirmOrder,
        createAddress,
        currenciesConfig,
        currency: selectedCurrency,
        decrementItem,
        incrementItem,
        initiatePayment,
        paymentMethods,
        removeItem,
        selectedPaymentMethod,
        setCurrency,
        updateAddress,
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

export function useCart<T extends CartsCollection>() {
  const { addItem, cart, clearCart, decrementItem, incrementItem, removeItem } = useEcommerce()

  if (!addItem) {
    throw new Error('useCart must be used within an EcommerceProvider')
  }

  return { addItem, cart: cart as T, clearCart, decrementItem, incrementItem, removeItem }
}

export const usePayments = () => {
  const { confirmOrder, initiatePayment, paymentMethods, selectedPaymentMethod } = useEcommerce()

  if (!initiatePayment) {
    throw new Error('usePayments must be used within an EcommerceProvider')
  }

  return { confirmOrder, initiatePayment, paymentMethods, selectedPaymentMethod }
}

export function useAddresses<T extends AddressesCollection>() {
  const { addresses, createAddress, updateAddress } = useEcommerce()

  if (!createAddress) {
    throw new Error('usePayments must be used within an EcommerceProvider')
  }

  return { addresses: addresses as T[], createAddress, updateAddress }
}

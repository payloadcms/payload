'use client'

import type { Product, User } from '@/payload-types'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'

import type { CartItem } from './reducer'

import { useAuth } from '../Auth'
import { cartReducer } from './reducer'

export type CartContext = {
  addItemToCart: (item: CartItem) => void
  cart: User['cart']
  cartIsEmpty: boolean | undefined
  cartQuantity: number
  cartTotal: {
    amount: number
    currency: string
  }
  clearCart: () => void
  decrementQuantity: (id: string) => void
  deleteItemFromCart: (id: string) => void
  hasInitializedCart: boolean
  incrementQuantity: (id: string) => void
  isProductInCart: (product: Product, variantId?: string) => boolean
}

const Context = createContext({} as CartContext)

export const useCart = () => useContext(Context)

const arrayHasItems = (array) => Array.isArray(array) && array.length > 0

/**
 * ensure that cart items are fully populated, filter out any items that are not
 * this will prevent discontinued products from appearing in the cart
 */
const flattenCart = (cart: User['cart']): User['cart'] => ({
  ...cart,
  items: cart?.items
    ?.map((item) => {
      if (!item?.product) {
        return null
      }

      return {
        ...item,
        // flatten relationship to product
        product: typeof item.product === 'string' ? item.product : item.product.id,
        variantID: item?.variant,
        quantity: typeof item?.quantity === 'number' ? item?.quantity : 0,
        variant: item?.variant,
      }
    })
    .filter(Boolean) as CartItem[],
})

// Step 1: Check local storage for a cart
// Step 2: If there is a cart, fetch the products and hydrate the cart
// Step 3: Authenticate the user
// Step 4: If the user is authenticated, merge the user's cart with the local cart
// Step 4B: Sync the cart to Payload and clear local storage
// Step 5: If the user is logged out, sync the cart to local storage only

export const CartProvider = (props) => {
  // const { setTimedNotification } = useNotifications();
  const { children } = props
  const { status: authStatus, user } = useAuth()

  const [cart, dispatchCart] = useReducer(cartReducer, {})

  const [total, setTotal] = useState<{
    amount: number
    currency: string
  }>({
    amount: 0,
    currency: 'usd',
  })

  const [quantity, setQuantity] = useState<number>(0)

  const hasInitialized = useRef(false)
  const [hasInitializedCart, setHasInitialized] = useState(false)

  // Check local storage for a cart
  // If there is a cart, fetch the products and hydrate the cart
  useEffect(() => {
    // wait for the user to be defined before initializing the cart
    if (user === undefined) return
    if (!hasInitialized.current) {
      hasInitialized.current = true

      const syncCartFromLocalStorage = async () => {
        const localCart = localStorage.getItem('cart')

        const parsedCart = JSON.parse(localCart || '{}')

        if (parsedCart?.items && parsedCart?.items?.length > 0) {
          dispatchCart({
            type: 'SET_CART',
            payload: {
              items: parsedCart.items,
            },
          })
        } else {
          dispatchCart({
            type: 'SET_CART',
            payload: {
              items: [],
            },
          })
        }
      }

      void syncCartFromLocalStorage()
    }
  }, [user])

  // authenticate the user and if logged in, merge the user's cart with local state
  // only do this after we have initialized the cart to ensure we don't lose any items
  useEffect(() => {
    if (!hasInitialized.current) return

    if (authStatus === 'loggedIn') {
      // merge the user's cart with the local state upon logging in
      dispatchCart({
        type: 'MERGE_CART',
        payload: user?.cart,
      })
    }

    if (authStatus === 'loggedOut') {
      // clear the cart from local state after logging out
      dispatchCart({
        type: 'CLEAR_CART',
      })
    }
  }, [user, authStatus])

  // every time the cart changes, determine whether to save to local storage or Payload based on authentication status
  // upon logging in, merge and sync the existing local cart to Payload
  useEffect(() => {
    // wait until we have attempted authentication (the user is either an object or `null`)
    if (!hasInitialized.current || user === undefined || !cart?.items) return

    const flattenedCart = flattenCart(cart)

    if (user) {
      // prevent updating the cart when the cart hasn't changed
      if (JSON.stringify(flattenCart(user.cart)) === JSON.stringify(flattenedCart)) {
        setHasInitialized(true)
        return
      }

      try {
        const syncCartToPayload = async () => {
          const req = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
            // Make sure to include cookies with fetch
            body: JSON.stringify({
              cart: flattenedCart,
            }),
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PATCH',
          })

          if (req.ok) {
            localStorage.setItem('cart', '[]')
          }
        }

        void syncCartToPayload()
      } catch (e) {
        console.error('Error while syncing cart to Payload.')
      }
    } else {
      localStorage.setItem('cart', JSON.stringify(cart))
    }

    setHasInitialized(true)
  }, [user, cart])

  const isProductInCart = useCallback(
    (incomingProduct: Product, variantId?: string): boolean => {
      let isInCart = false
      const { items: itemsInCart } = cart || {}
      if (Array.isArray(itemsInCart) && itemsInCart.length > 0) {
        isInCart = Boolean(
          itemsInCart.find(({ product, variant }) => {
            // Check for variant first
            if (variantId) {
              return variant === variantId
            } else {
              return typeof product === 'string'
                ? product === incomingProduct.id
                : product?.id === incomingProduct.id
            }
          }),
        )
      }
      return isInCart
    },
    [cart],
  )

  // this method can be used to add new items AND update existing ones
  const addItemToCart = useCallback((incomingItem: CartItem) => {
    dispatchCart({
      type: 'ADD_ITEM',
      payload: incomingItem,
    })
  }, [])

  const incrementQuantity = useCallback((id: string) => {
    dispatchCart({
      type: 'INCREMENT_QUANTITY',
      payload: id,
    })
  }, [])

  const decrementQuantity = useCallback((id: string) => {
    dispatchCart({
      type: 'DECREMENT_QUANTITY',
      payload: id,
    })
  }, [])

  const deleteItemFromCart = useCallback((id: string) => {
    dispatchCart({
      type: 'DELETE_ITEM',
      payload: id,
    })
  }, [])

  const clearCart = useCallback(() => {
    dispatchCart({
      type: 'CLEAR_CART',
    })
  }, [])

  // calculate the new cart total whenever the cart changes
  useEffect(() => {
    if (!hasInitialized) return

    const newTotal =
      cart?.items?.reduce((acc, item) => {
        if (typeof item.product === 'string' || !item.product) return acc

        let itemCost = 0

        itemCost = item.unitPrice * item.quantity

        return acc + itemCost
      }, 0) || 0

    const newQuantity =
      cart?.items?.reduce((quantity, product) => product.quantity! + quantity, 0) || 0

    setTotal({
      amount: newTotal,
      currency: 'USD',
    })

    setQuantity(newQuantity)
  }, [cart, hasInitialized])

  return (
    <Context.Provider
      value={{
        addItemToCart,
        cart,
        cartIsEmpty: hasInitializedCart && !arrayHasItems(cart?.items),
        cartQuantity: quantity,
        cartTotal: total,
        clearCart,
        decrementQuantity,
        deleteItemFromCart,
        hasInitializedCart,
        incrementQuantity,
        isProductInCart,
      }}
    >
      {children && children}
    </Context.Provider>
  )
}

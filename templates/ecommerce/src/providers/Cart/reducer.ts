import type { Product, User } from '../../payload-types'

type CartType = User['cart']

export type CartItem = User['cart']['items'][0]

type CartAction =
  | {
      type: 'SET_CART'
      payload: CartType
    }
  | {
      type: 'MERGE_CART'
      payload: CartType
    }
  | {
      type: 'ADD_ITEM'
      payload: CartItem
    }
  | {
      type: 'DELETE_ITEM'
      payload: Product
    }
  | {
      type: 'CLEAR_CART'
    }

export const cartReducer = (cart: CartType, action: CartAction): CartType => {
  switch (action.type) {
    case 'SET_CART': {
      return action.payload
    }

    case 'MERGE_CART': {
      const { payload: incomingCart } = action

      const syncedItems: CartItem[] = [
        ...(cart?.items || []),
        ...(incomingCart?.items || []),
      ].reduce((acc, item) => {
        // remove duplicates
        const productId = typeof item.product === 'string' ? item.product : item.product.id

        const indexInAcc = acc.findIndex(({ product }) =>
          typeof product === 'string' ? product === productId : product.id === productId,
        ) // eslint-disable-line function-paren-newline

        if (indexInAcc > -1) {
          acc[indexInAcc] = {
            ...acc[indexInAcc],
            // customize the merge logic here, e.g.:
            // quantity: acc[indexInAcc].quantity + item.quantity
          }
        } else {
          acc.push(item)
        }
        return acc
      }, [])

      return {
        ...cart,
        items: syncedItems,
      }
    }

    case 'ADD_ITEM': {
      // if the item is already in the cart, increase the quantity
      const { payload: incomingItem } = action
      const productId =
        typeof incomingItem.product === 'string' ? incomingItem.product : incomingItem.product.id

      const indexInCart = cart.items.findIndex(({ product }) =>
        typeof product === 'string' ? product === productId : product.id === productId,
      ) // eslint-disable-line function-paren-newline

      let withAddedItem = [...(cart?.items || [])]

      if (indexInCart === -1) {
        withAddedItem.push(incomingItem)
      }

      if (indexInCart > -1) {
        withAddedItem[indexInCart] = {
          ...withAddedItem[indexInCart],
          quantity: incomingItem.quantity > 0 ? incomingItem.quantity : 1,
        }
      }

      return {
        ...cart,
        items: withAddedItem,
      }
    }

    case 'DELETE_ITEM': {
      const { payload: incomingProduct } = action
      const withDeletedItem = { ...cart }

      const indexInCart = cart.items.findIndex(({ product }) =>
        typeof product === 'string'
          ? product === incomingProduct.id
          : product.id === incomingProduct.id,
      ) // eslint-disable-line function-paren-newline

      if (indexInCart > -1) withDeletedItem.items.splice(indexInCart, 1)

      return withDeletedItem
    }

    case 'CLEAR_CART': {
      return {
        ...cart,
        items: [],
      }
    }

    default: {
      return cart
    }
  }
}

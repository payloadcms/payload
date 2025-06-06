import type { DefaultDocumentIDType } from 'payload'

import type { CartItemClient } from '../../types.js'
import type { CartAction } from './types.js'

import { cartArrayToMap } from './utilities.js'

export function cartReducer(
  state: Map<DefaultDocumentIDType, CartItemClient>,
  action: CartAction,
): Map<DefaultDocumentIDType, CartItemClient> {
  const nextMapState = new Map(state)

  const getKey = (item: CartItemClient): DefaultDocumentIDType =>
    'variantID' in item && item.variantID
      ? item.variantID
      : 'productID' in item && item.productID
        ? item.productID
        : ''

  switch (action.type) {
    case 'ADD_ITEM': {
      const key = getKey(action.payload)
      const existing = nextMapState.get(key)
      const quantity = existing
        ? existing.quantity + action.payload.quantity
        : action.payload.quantity
      nextMapState.set(key, { ...action.payload, quantity })
      return nextMapState
    }

    case 'CLEAR_CART':
      return new Map()

    case 'DECREMENT_QUANTITY': {
      const item = nextMapState.get(action.payload)
      if (item) {
        if (item.quantity > 1) {
          nextMapState.set(action.payload, { ...item, quantity: item.quantity - 1 })
        } else {
          nextMapState.delete(action.payload)
        }
      }
      return nextMapState
    }

    case 'INCREMENT_QUANTITY': {
      const item = nextMapState.get(action.payload)
      if (item) {
        nextMapState.set(action.payload, { ...item, quantity: item.quantity + 1 })
      }
      return nextMapState
    }

    case 'MERGE_CART': {
      for (const [key, item] of action.payload.entries()) {
        const existing = nextMapState.get(key)
        const quantity = existing ? existing.quantity + item.quantity : item.quantity
        nextMapState.set(key, { ...item, quantity })
      }
      return nextMapState
    }

    case 'REMOVE_ITEM':
      nextMapState.delete(action.payload)
      return nextMapState

    case 'SET_CART': {
      const nextMapState = cartArrayToMap(action.payload)

      return nextMapState
    }

    default:
      return state
  }
}

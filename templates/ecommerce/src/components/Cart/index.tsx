import React from 'react'

import { CartModal } from './CartModal'
import { Cart as CartType } from '@/payload-types'

export type CartItem = NonNullable<CartType['items']>[number]

export function Cart() {
  return <CartModal />
}

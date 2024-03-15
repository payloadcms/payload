import React from 'react'

import type { Product } from '../../../payload/payload-types'

import { useCart } from '../../_providers/Cart'
import classes from './index.module.scss'

export const RemoveFromCartButton: React.FC<{
  className?: string
  product: Product
}> = (props) => {
  const { className, product } = props

  const { deleteItemFromCart, isProductInCart } = useCart()

  const productIsInCart = isProductInCart(product)

  if (!productIsInCart) {
    return <div>Item is not in the cart</div>
  }

  return (
    <button
      className={[className, classes.removeFromCartButton].filter(Boolean).join(' ')}
      onClick={() => {
        deleteItemFromCart(product)
      }}
      type="button"
    >
      Remove
    </button>
  )
}

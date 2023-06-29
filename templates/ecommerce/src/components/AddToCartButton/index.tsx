import React, { useEffect, useState } from 'react'

import { Product } from '../../payload-types'
import { useCart } from '../../providers/Cart'
import { Button, Props } from '../Button'

import classes from './index.module.scss'

export const AddToCartButton: React.FC<{
  product: Product
  quantity?: number
  className?: string
  appearance?: Props['appearance']
}> = props => {
  const { product, quantity = 1, className, appearance = 'primary' } = props

  const { cart, addItemToCart, isProductInCart } = useCart()

  const [showInCart, setShowInCart] = useState<boolean>()

  useEffect(() => {
    setShowInCart(isProductInCart(product))
  }, [isProductInCart, product, cart])

  if (showInCart) {
    return (
      <Button
        href="/cart"
        label="View in cart"
        el="link"
        appearance={appearance}
        className={[className, classes.addToCartButton].filter(Boolean).join(' ')}
      />
    )
  }

  return (
    <Button
      type="button"
      appearance={appearance}
      onClick={() => {
        addItemToCart({
          product,
          quantity,
        })
      }}
      className={[className, classes.addToCartButton].filter(Boolean).join(' ')}
      label="Add to cart"
    />
  )
}

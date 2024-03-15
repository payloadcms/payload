'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Product } from '../../../payload/payload-types'
import type { Props } from '../Button'

import { useCart } from '../../_providers/Cart'
import { Button } from '../Button'
import classes from './index.module.scss'

export const AddToCartButton: React.FC<{
  appearance?: Props['appearance']
  className?: string
  product: Product
  quantity?: number
}> = (props) => {
  const { appearance = 'primary', className, product, quantity = 1 } = props

  const { addItemToCart, cart, hasInitializedCart, isProductInCart } = useCart()

  const [isInCart, setIsInCart] = useState<boolean>()
  const router = useRouter()

  useEffect(() => {
    setIsInCart(isProductInCart(product))
  }, [isProductInCart, product, cart])

  return (
    <Button
      appearance={appearance}
      className={[
        className,
        classes.addToCartButton,
        appearance === 'default' && isInCart && classes.green,
        !hasInitializedCart && classes.hidden,
      ]
        .filter(Boolean)
        .join(' ')}
      el={isInCart ? 'link' : undefined}
      href={isInCart ? '/cart' : undefined}
      label={isInCart ? `✓ View in cart` : `Add to cart`}
      onClick={
        !isInCart
          ? () => {
              addItemToCart({
                product,
                quantity,
              })

              router.push('/cart')
            }
          : undefined
      }
      type={!isInCart ? 'button' : undefined}
    />
  )
}

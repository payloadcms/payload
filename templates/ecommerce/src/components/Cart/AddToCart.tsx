'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/react'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'

type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const { addItem, cart } = useCart()
  const searchParams = useSearchParams()

  const selectedVariantId = searchParams.get('variant')

  const variants = product.variants?.docs || []

  const productUrl = useMemo(() => {
    const base = `/product/${product.slug}`

    // if (selectedVariantId) {
    //   const variant = variants?.find((variant) => variant.id === selectedVariantId)

    //   if (!variant) {
    //     return base
    //   }

    //   const variantOptions = variant.options.map((option) => `${option.slug}=${option.slug}`)
    //   return `${base}?variant=${selectedVariantId}&${variantOptions.join('&')}`
    // } else {
    //   return base
    // }
  }, [product.slug, selectedVariantId, variants])

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      let unitPrice = product.priceInUSD || 0

      // if (selectedVariantId && product.enableVariants && product?.variants?.length) {
      //   const variant = product?.variants?.find((variant) => variant.id === selectedVariantId)
      //   unitPrice = variant?.price || 0
      // }

      addItem({
        product: product.id,
        variant: selectedVariantId ?? undefined,
      })
    },
    [addItem, product, productUrl, selectedVariantId],
  )

  const disabled = useMemo<boolean>(() => {
    if (product.enableVariants) {
      if (!selectedVariantId) {
        return true
      }

      // const variant = product.variants?.find((variant) => variant.id === selectedVariantId)

      // if (!variant) {
      //   return true
      // }

      // if (variant.stock === 0) {
      //   return true
      // }
    } else {
      if (product.inventory === 0) {
        return true
      }
    }

    return false
  }, [selectedVariantId])

  return (
    <Button
      aria-label="Add to cart"
      variant={'outline'}
      className={clsx({
        'hover:opacity-90': true,
      })}
      disabled={disabled}
      onClick={addToCart}
      type="submit"
    >
      Add To Cart
    </Button>
  )
}

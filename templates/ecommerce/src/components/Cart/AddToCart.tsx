'use client'

import type { Product } from '@/payload-types'

import { useCart } from '@/providers/Cart'
import clsx from 'clsx'
import { PlusIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'

type ProductVariant = NonNullable<NonNullable<Product['variants']>['variants']>[number]

type Props = {
  product: Product
  variants?: ProductVariant[]
}

export function AddToCart({ product, variants }: Props) {
  const { addItemToCart, cart } = useCart()
  const searchParams = useSearchParams()

  const selectedVariantId = searchParams.get('variant')

  const buttonClasses =
    'relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white'
  const disabledClasses = 'cursor-not-allowed opacity-60 hover:opacity-60'

  const productUrl = useMemo(() => {
    const base = `/product/${product.slug}`

    if (selectedVariantId) {
      const variant = variants?.find((variant) => variant.id === selectedVariantId)

      if (!variant) {
        return base
      }

      const variantOptions = variant.options.map((option) => `${option.slug}=${option.slug}`)
      return `${base}?variant=${selectedVariantId}&${variantOptions.join('&')}`
    } else {
      return base
    }
  }, [product.slug, selectedVariantId, variants])

  if (!true) {
    return (
      <button aria-disabled className={clsx(buttonClasses, disabledClasses)} type="submit">
        Out Of Stock
      </button>
    )
  }

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      let unitPrice = product.price || 0

      if (selectedVariantId && product.enableVariants && product.variants?.variants?.length) {
        const variant = product.variants?.variants?.find(
          (variant) => variant.id === selectedVariantId,
        )
        unitPrice = variant?.price || 0
      }

      console.log({
        id: selectedVariantId ?? product.id,
        product,
        quantity: 1,
        url: productUrl,
        unitPrice,
        variant: selectedVariantId ?? undefined,
      })

      addItemToCart({
        id: selectedVariantId ?? product.id,
        product,
        quantity: 1,
        url: productUrl,
        unitPrice,
        variant: selectedVariantId ?? undefined,
      })
    },
    [addItemToCart, product, productUrl, selectedVariantId],
  )

  return (
    <button
      aria-label="Add to cart"
      className={clsx(buttonClasses, {
        'hover:opacity-90': true,
      })}
      onClick={addToCart}
      type="submit"
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Add To Cart
    </button>
  )
}

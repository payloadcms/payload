'use client'

import type { InfoType } from '@/collections/Products/ui/types'
import type { Product } from '@/payload-types'

import { useCart } from '@/providers/Cart'
import clsx from 'clsx'
import { PlusIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'

type ProductVariant = any // Product['variants']['variants'][number]

type BaseProps = {
  product: Product
}

type PropsWithVariants = {
  info?: never
  variants: ProductVariant[]
}

type PropsWithInfo = {
  info: any //Product['variants']['variants'][0]['info']
  variants?: never
}

type Props = BaseProps & (PropsWithInfo | PropsWithVariants)

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
      const info = variant?.info as InfoType
      const variantOptions = info.options.map((option) => `${option.key.slug}=${option.slug}`)
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

  return (
    <button
      aria-label="Add to cart"
      className={clsx(buttonClasses, {
        'hover:opacity-90': true,
      })}
      onClick={(e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault()

        addItemToCart({
          id: selectedVariantId ?? product.id,
          product,
          quantity: 1,
          url: productUrl,
          variant: selectedVariantId ?? undefined,
        })
      }}
      type="submit"
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Add To Cart
    </button>
  )
}

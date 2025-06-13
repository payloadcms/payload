import type { Product } from '@/payload-types'

import RichText from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import React, { Suspense } from 'react'

import { VariantSelector } from './VariantSelector'

export function ProductDescription({ product }: { product: Product }) {
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0,
    currency = 'usd'

  const hasVariants = product.enableVariants && product.variants?.length

  if (hasVariants) {
    const variantsOrderedByPrice = product.variants?.sort((a, b) => {
      return a.price - b.price
    })

    if (variantsOrderedByPrice) {
      lowestAmount = variantsOrderedByPrice[0].price
      highestAmount = variantsOrderedByPrice[variantsOrderedByPrice.length - 1].price
    }
  } else if (product.price) {
    amount = product.price
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-medium">{product.title}</h1>
        <div className="uppercase font-mono">
          {hasVariants ? (
            <Price
              currencyCode={currency}
              highestAmount={highestAmount}
              lowestAmount={lowestAmount}
            />
          ) : (
            <Price amount={amount} currencyCode={currency} />
          )}
        </div>
      </div>

      {product.description ? (
        <RichText className="" data={product.description} enableGutter={false} />
      ) : null}

      <hr />

      {hasVariants && (
        <>
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>

          <hr />
        </>
      )}

      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <AddToCart product={product} variants={product?.variants || []} />
        </Suspense>
      </div>
    </div>
  )
}

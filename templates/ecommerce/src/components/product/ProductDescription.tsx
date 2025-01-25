import type { Product } from '@/payload-types'
import type { InfoType } from '@/collections/Products/ui/types'

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

  const hasVariants = product.enableVariants && product.variants?.variants?.length

  if (hasVariants) {
    const variantsOrderedByPrice = product.variants?.variants?.sort((a, b) => {
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
    <React.Fragment>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
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
      <Suspense fallback={null}>
        <VariantSelector product={product} />
      </Suspense>

      {product.description ? (
        <RichText className="mb-6" data={product.description} enableGutter={false} />
      ) : null}

      <Suspense fallback={null}>
        <AddToCart product={product} variants={product.variants?.variants || []} />
      </Suspense>
    </React.Fragment>
  )
}

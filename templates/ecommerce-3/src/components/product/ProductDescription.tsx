import type { Product } from '@/payload-types'
import type { InfoType } from '@/collections/Products/ui/types'

import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/cart/add-to-cart'
import { Price } from '@/components/Price'
import { Prose } from '@/components/Prose'
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
      const aInfo = a.info as InfoType
      const bInfo = b.info as InfoType
      return aInfo.price.amount - bInfo.price.amount
    })

    if (variantsOrderedByPrice) {
      lowestAmount = (variantsOrderedByPrice[0].info as InfoType)?.price?.amount
      highestAmount = (variantsOrderedByPrice[variantsOrderedByPrice.length - 1].info as InfoType)
        ?.price?.amount
    }
  } else if (product.info) {
    const info = product.info as InfoType
    amount = info.price.amount
    currency = info.price.currency
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
        <RichText className="mb-6" content={product.description} enableGutter={false} />
      ) : null}

      <Suspense fallback={null}>
        <AddToCart product={product} variants={product.variants?.variants || []} />
      </Suspense>
    </React.Fragment>
  )
}

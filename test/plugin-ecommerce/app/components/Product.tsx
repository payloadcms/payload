'use client'
import { Product as ProductType } from '@payload-types'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/react'
import React from 'react'

type Props = {
  product: ProductType
}

export const Product: React.FC<Props> = ({ product }) => {
  const { addItem, removeItem } = useCart()
  const { formatCurrency, currency } = useCurrency()

  const pricePath = `priceIn${currency.code.toUpperCase()}`
  // @ts-expect-error
  const productPrice = pricePath in product ? product[pricePath] : undefined

  const hasVariants =
    product.enableVariants && product.variants?.docs?.length && product.variants?.docs?.length > 0

  return (
    <div>
      <h2>{product.name}</h2>

      <div>Price: {formatCurrency(productPrice)}</div>

      {!hasVariants && (
        <div>
          <button
            onClick={() => {
              addItem({
                productID: product.id,
                quantity: 1,
                product: product,
              })
            }}
          >
            Add to cart
          </button>
        </div>
      )}

      {hasVariants &&
        product.variants!.docs!.map((variant) => {
          if (typeof variant === 'string') {
            return null
          }

          return (
            <div key={variant.id}>
              <div>{variant.title}</div>
              <div>Price: {formatCurrency(variant.priceInUSD)}</div>

              <button
                onClick={() => {
                  addItem({
                    productID: product.id,
                    variantID: variant.id,
                    quantity: 1,
                    variant: variant,
                    product: product,
                  })
                }}
              >
                Add to cart
              </button>
            </div>
          )
        })}
    </div>
  )
}

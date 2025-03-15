import type { Product } from '@/payload-types'

import { Grid } from '@/components/grid'
import { GridTileImage } from '@/components/grid/tile'
import Link from 'next/link'
import React from 'react'

export function ProductGridItems({ products }: { products: Partial<Product>[] }) {
  return (
    <React.Fragment>
      {products.map((product) => {
        const firstGalleryImage =
          typeof product.gallery?.[0] !== 'string' ? product.gallery?.[0] : undefined
        const metaImage = typeof product.meta?.image !== 'string' ? product.meta?.image : undefined

        const image = metaImage || firstGalleryImage

        if (!image) return null

        return (
          <Grid.Item className="animate-fadeIn" key={product.id}>
            <Link
              className="relative inline-block h-full w-full"
              href={`/products/${product.slug}`}
            >
              <GridTileImage
                label={{
                  amount: product.price!,
                  currencyCode: product.currency!,
                  title: product.title!,
                }}
                media={image}
              />
            </Link>
          </Grid.Item>
        )
      })}
    </React.Fragment>
  )
}

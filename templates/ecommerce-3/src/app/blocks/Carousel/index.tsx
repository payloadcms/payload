import type { Product } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import React from 'react'

import type { CarouselBlockProps } from './types'

import { CarouselClient } from './Carousel.client'

export const CarouselBlock: React.FC<
  CarouselBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, categories, limit = 3, populateBy, selectedDocs } = props

  let products: Product[] = []

  if (populateBy === 'collection') {
    const payload = await getPayloadHMR({ config: configPromise })

    const flattenedCategories = categories?.length
      ? categories.map((category) => {
          if (typeof category === 'string') return category
          else return category.id
        })
      : null

    const fetchedProducts = await payload.find({
      collection: 'products',
      depth: 1,
      limit,
      ...(flattenedCategories && flattenedCategories.length > 0
        ? {
            where: {
              categories: {
                in: flattenedCategories,
              },
            },
          }
        : {}),
    })

    products = fetchedProducts.docs
  } else {
    products = selectedDocs.map((post) => {
      if (typeof post.value !== 'string') return post.value
    })
  }

  if (!products?.length) return null

  return (
    <div className=" w-full pb-6 pt-1">
      <CarouselClient products={products} />
    </div>
  )
}

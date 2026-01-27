import type { Product, CarouselBlock as CarouselBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { DefaultDocumentIDType, getPayload } from 'payload'
import React from 'react'

import { CarouselClient } from './Component.client'

export const CarouselBlock: React.FC<
  CarouselBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async (props) => {
  const { id, categories, limit = 3, populateBy, selectedDocs } = props

  let products: Product[] = []

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.length
      ? categories.map((category) => {
          if (typeof category === 'object') return category.id
          else return category
        })
      : null

    const fetchedProducts = await payload.find({
      collection: 'products',
      depth: 1,
      limit: limit || undefined,
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
  } else if (selectedDocs?.length) {
    products = selectedDocs.map((post) => {
      if (typeof post.value !== 'string') return post.value
    }) as Product[]
  }

  if (!products?.length) return null

  return (
    <div className=" w-full pb-6 pt-1">
      <CarouselClient products={products} />
    </div>
  )
}

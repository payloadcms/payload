import type { Product, ArchiveBlock as ArchiveBlockProps } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import React from 'react'
import { RichText } from '@/components/RichText'

import { CollectionArchive } from '../../components/CollectionArchive'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, categories, introContent, limit = 3, populateBy, selectedDocs } = props

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
      limit: limit!,
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
    products = selectedDocs?.map((post) => {
      if (typeof post.value !== 'string') return post.value
    }) as Product[]
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ml-0 max-w-[48rem]" content={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={products} />
    </div>
  )
}

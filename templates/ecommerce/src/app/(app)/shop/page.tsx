import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Search',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: searchValue, sort } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      currency: true,
      price: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue
      ? {
          where: {
            or: [
              {
                title: {
                  like: searchValue,
                },
              },
              {
                description: {
                  like: searchValue,
                },
              },
            ],
          },
        }
      : {}),
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <div>
      {searchValue ? (
        <p className="mb-4">
          {products.docs?.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}
      {products?.docs.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.docs.map((product) => {
            return <ProductGridItem key={product.slug} product={product} />
          })}
        </Grid>
      ) : null}
    </div>
  )
}

import { Grid } from '@/components/grid'
import { ProductGridItems } from '@/components/layout/ProductGridItems'
import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import React from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Search',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const { q: searchValue, sort } = searchParams as { [key: string]: string }
  const payload = await getPayloadHMR({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
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
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products.docs} />
        </Grid>
      ) : null}
    </div>
  )
}

import { Grid } from '@/components/grid'
import { ProductGridItems } from '@/components/layout/ProductGridItems'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Search',
}

export default async function SearchCategoryPage({
  params,
  searchParams,
}: {
  params: { category: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const { q: searchValue, sort } = searchParams as { [key: string]: string }
  const { category } = params
  const payload = await getPayload({ config: configPromise })

  // Get the category id so we can search for products that belong to this category
  const categoryDoc = (
    await payload.find({
      collection: 'categories',
      where: {
        slug: { equals: category },
      },
    })
  ).docs?.[0]

  const products = await payload.find({
    collection: 'products',
    ...(sort ? { sort } : { sort: 'title' }),
    where: {
      and: [
        ...(categoryDoc ? [{ categories: { contains: categoryDoc.id } }] : []),
        {
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
      ],
    },
  })
  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <React.Fragment>
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
    </React.Fragment>
  )
}

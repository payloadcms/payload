import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Search',
}

export default async function SearchCategoryPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ category: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await searchParamsPromise
  const searchValue = searchParams?.q
  const sort = searchParams?.sort

  const { category } = await paramsPromise

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
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInUSD: true,
      variants: true,
    },
    populate: {
      variants: {
        priceInUSD: true,
      },
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
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.docs.map((product) => {
            return <ProductGridItem key={product.slug} product={product} />
          })}
        </Grid>
      ) : null}
    </React.Fragment>
  )
}

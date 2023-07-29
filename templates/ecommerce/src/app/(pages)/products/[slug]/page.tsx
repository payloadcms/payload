import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Product, Product as ProductType } from '../../../../payload/payload-types'
import { fetchDoc } from '../../../_api/fetchDoc'
import { fetchDocs } from '../../../_api/fetchDocs'
import { Blocks } from '../../../_components/Blocks'
import { PaywallBlocks } from '../../../_components/PaywallBlocks'
import { ProductHero } from '../../../_heros/Product'
import { generateMeta } from '../../../_utilities/generateMeta'

export default async function Product({ params: { slug } }) {
  const product = await fetchDoc<Product>({
    collection: 'products',
    slug,
  })

  if (!product) return notFound()

  const { layout } = product

  return (
    <React.Fragment>
      <ProductHero product={product} />
      <Blocks blocks={layout} />
      {product?.enablePaywall && <PaywallBlocks productSlug={slug as string} disableTopPadding />}
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  const products = await fetchDocs<ProductType>('products')

  return products?.map(({ slug }) => slug)
}

export async function generateMetadata({ params: { slug } }): Promise<Metadata> {
  const product = await fetchDoc<Product>({
    collection: 'products',
    slug,
  })

  return generateMeta({ doc: product })
}

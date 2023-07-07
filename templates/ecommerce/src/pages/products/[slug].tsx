import React from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'

import { Blocks } from '../../components/Blocks'
import { ProductHero } from '../../components/Hero/Product'
import { PaywallBlocks } from '../../components/PaywallBlocks'
import { getApolloClient } from '../../graphql'
import { PRODUCT, PRODUCTS } from '../../graphql/products'
import { Product as ProductType } from '../../payload-types'

export const Product: React.FC<{
  product: ProductType
  preview?: boolean
}> = props => {
  const { product } = props

  const { query } = useRouter()

  if (product) {
    const { layout } = product

    return (
      <React.Fragment>
        <ProductHero product={product} />
        <Blocks blocks={layout} />
        <PaywallBlocks productSlug={query.slug as string} disableTopPadding />
      </React.Fragment>
    )
  }

  return null
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const apolloClient = getApolloClient()

  const { data } = await apolloClient.query({
    query: PRODUCT,
    variables: {
      slug: params?.slug,
    },
  })

  if (!data.Products.docs[0]) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      product: data?.Products?.docs?.[0] || null,
      header: data?.Header || null,
      footer: data?.Footer || null,
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const apolloClient = getApolloClient()

  const { data } = await apolloClient.query({
    query: PRODUCTS,
  })

  return {
    paths: data.Products.docs.map(({ slug }) => ({
      params: { slug },
    })),
    fallback: 'blocking',
  }
}

export default Product

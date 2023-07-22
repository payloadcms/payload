import React from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'

import { Blocks } from '../components/Blocks'
import { Hero } from '../components/Hero'
import { getApolloClient } from '../graphql'
import { PAGE, PAGES } from '../graphql/pages'
import type { Page } from '../payload-types'
import { staticHome } from '../seed/static-home'

const PageTemplate: React.FC<{
  page: Page
  preview?: boolean
}> = props => {
  const { page } = props

  if (page) {
    const { hero, layout } = page

    return (
      <React.Fragment>
        <Hero {...hero} />
        <Blocks
          blocks={layout}
          disableTopPadding={hero?.type === 'none' || hero?.type === 'lowImpact'}
        />
      </React.Fragment>
    )
  }

  return null
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const apolloClient = getApolloClient()
  const slug = params?.slug || 'home'

  const { data } = await apolloClient.query({
    query: PAGE,
    variables: {
      slug,
    },
  })

  // If no `home` page exists, render a static one using dummy content
  // You should delete this code once you have created a home page in the CMS
  // This is really only useful for those who are demoing this template
  if (!data.Pages.docs[0] && slug === 'home') {
    return {
      props: {
        page: staticHome,
        header: null,
        footer: null,
        collection: 'pages',
        id: null,
      },
    }
  }

  if (!data.Pages.docs[0]) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      page: data?.Pages?.docs?.[0] || null,
      header: data?.Header || null,
      footer: data?.Footer || null,
      collection: 'pages',
      id: data?.Pages?.docs?.[0]?.id || null,
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const apolloClient = getApolloClient()

  const { data } = await apolloClient.query({
    query: PAGES,
  })

  return {
    paths: data.Pages.docs.map(({ slug }) => ({
      params: { slug },
    })),
    fallback: 'blocking',
  }
}

export default PageTemplate

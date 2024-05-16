import type { GetStaticPaths } from 'next'

import React from 'react'

import type { Page } from '../../payload-types'

import Blocks from '../../components/Blocks'

export default async function Page({ params: { slug = 'home' } }) {
  const page = await getPage(slug)

  return (
    <React.Fragment>
      <Blocks blocks={page.layout} />
    </React.Fragment>
  )
}

export const getPage = async (slug: string) => {
  const pageQuery = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?where[slug][equals]=${slug}`,
  ).then((res) => res.json())

  return pageQuery.docs[0]
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  const pagesQuery: { docs: Page[] } = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?limit=100`,
  ).then((res) => res.json())

  return {
    fallback: 'blocking',
    paths: pagesQuery.docs.map((page) => ({
      params: {
        slug: page.slug,
      },
    })),
  }
}

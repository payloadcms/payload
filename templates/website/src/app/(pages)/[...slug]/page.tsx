import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Page } from '../../../payload/payload-types'
import { staticHome } from '../../../payload/seed/static-home'
import { fetchDoc } from '../../_api/fetchDoc'
import { fetchDocs } from '../../_api/fetchDocs'
import { Blocks } from '../../_components/Blocks'
import { Hero } from '../../_components/Hero'
import { generateMeta } from '../../_utilities/generateMeta'

export default async function Page({ params: { slug: slugs = ['home'] } }) {
  const slug = slugs[slugs.length - 1]

  let page = await fetchDoc<Page>({
    collection: 'pages',
    slug,
  })

  // If no `home` page exists, render a static one using dummy content
  // You should delete this code once you have created a home page in the CMS
  // This is really only useful for those who are demoing this template
  if (!page && slug === 'home') {
    page = staticHome
  }

  if (!page) return notFound()

  const { hero, layout } = page

  return (
    <React.Fragment>
      <Hero {...hero} />
      <Blocks
        blocks={layout}
        disableTopPadding={!hero || hero?.type === 'none' || hero?.type === 'lowImpact'}
      />
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  const pages = await fetchDocs<Page>('pages')

  return pages?.map(({ slug }) => slug)
}

export async function generateMetadata({ params: { slug = ['home'] } }): Promise<Metadata> {
  const lastSlug = slug[slug.length - 1]

  let page = await fetchDoc<Page>({
    collection: 'pages',
    slug: lastSlug,
  })

  if (!page && lastSlug === 'home') {
    page = staticHome
  }

  return generateMeta({ doc: page })
}

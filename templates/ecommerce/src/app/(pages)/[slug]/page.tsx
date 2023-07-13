import React from 'react'
import { notFound } from 'next/navigation'

import { Page } from '../../../payload/payload-types'
import { staticHome } from '../../../payload/seed/static-home'
import { Blocks } from '../../_components/Blocks'
import { Hero } from '../../_components/Hero'
import { fetchDoc, fetchDocs } from '../../cms'

const PageTemplate = async ({ params: { slug = 'home' } }) => {
  let page = await fetchDoc<Page>('pages', slug)

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

export default PageTemplate

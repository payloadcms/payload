import React from 'react'
import { notFound } from 'next/navigation'

import { Page } from '../../../payload-types'
import { fetchDocs } from '@/app/_api/fetchDocs'
import { fetchDoc } from '@/app/_api/fetchDoc'
import { PageClient } from './page.client'

export default async function Page({ params: { slug = 'home' } }) {
  let page: Page | null = null

  try {
    page = await fetchDoc<Page>({
      collection: 'pages',
      slug,
    })
  } catch (error) {
    console.error(error)
  }

  if (!page) {
    return notFound()
  }

  return <PageClient page={page} />
}

export async function generateStaticParams() {
  try {
    const pages = await fetchDocs<Page>('pages')
    return pages?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

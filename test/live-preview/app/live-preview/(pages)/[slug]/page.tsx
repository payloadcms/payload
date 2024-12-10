/* eslint-disable no-restricted-exports */
import { notFound } from 'next/navigation.js'
import React from 'react'

import type { Page } from '../../../../payload-types.js'

import { getDoc } from '../../_api/getDoc.js'
import { getDocs } from '../../_api/getDocs.js'
import { PageClient } from './page.client.js'

type Args = {
  params: Promise<{ slug?: string }>
}
export default async function Page({ params: paramsPromise }: Args) {
  const { slug = 'home' } = await paramsPromise
  let page: null | Page = null

  try {
    page = await getDoc<Page>({
      slug,
      collection: 'pages',
    })
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }

  if (!page) {
    return notFound()
  }

  return <PageClient page={page} />
}

export async function generateStaticParams() {
  process.env.PAYLOAD_DROP_DATABASE = 'false'

  try {
    const pages = await getDocs<Page>('pages')
    return pages?.map(({ slug }) => slug)
  } catch (_err) {
    return []
  }
}

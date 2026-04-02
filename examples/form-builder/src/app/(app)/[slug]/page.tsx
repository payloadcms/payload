import config from '../../../payload.config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import type { Page as PageType } from '../../../payload-types'

import Blocks from '../../../components/Blocks'

interface PageParams {
  params: Promise<{
    slug?: string
  }>
}

// eslint-disable-next-line no-restricted-exports
export default async function Page({ params: paramsPromise }: PageParams) {
  const { slug = 'home' } = await paramsPromise
  const payload = await getPayload({ config })

  const pageRes = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const page = pageRes?.docs?.[0] as null | PageType

  if (page === null) {
    return notFound()
  }

  return (
    <React.Fragment>
      <Blocks blocks={page.layout} />
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const pagesRes = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 100,
    overrideAccess: false,
  })

  const pages = pagesRes?.docs

  return pages.map(({ slug }) =>
    slug !== 'home'
      ? {
          slug,
        }
      : {},
  )
}

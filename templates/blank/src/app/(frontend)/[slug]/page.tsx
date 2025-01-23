import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import { homeStatic } from '@/collections/Pages/home-static'

import type { Page as PageType } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = 'home' } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

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

  let page: PageType | null

  page = pageRes?.docs?.[0]

  if (!page && slug === 'home') {
    page = homeStatic
  }

  if (page === null) {
    return notFound()
  }

  return (
    <React.Fragment>
      <RenderBlocks blocks={page.layout} />
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pagesRes = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 100,
    overrideAccess: false,
    pagination: false,
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

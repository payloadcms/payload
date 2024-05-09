import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities/getPayloadHMR.js'
import { notFound } from 'next/navigation.js'
import React from 'react'

import type { Page } from '../../../../payload-types.js'

import { pagesSlug } from '../../../../shared.js'
import { PageClient } from './page.client.js'

// eslint-disable-next-line no-restricted-exports
export default async function Page({ params: { slug = 'home' } }) {
  const payload = await getPayloadHMR({ config })

  const res = await payload.find({
    collection: pagesSlug,
    depth: 2,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const page = res?.docs?.[0]

  if (!page) {
    return notFound()
  }

  return <PageClient page={page} />
}

export async function generateStaticParams() {
  process.env.PAYLOAD_DROP_DATABASE = 'false'
  const payload = await getPayloadHMR({ config })

  try {
    const { docs } = await payload.find({
      collection: postsSlug,
      depth: 0,
      limit: 100,
    })

    return docs?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

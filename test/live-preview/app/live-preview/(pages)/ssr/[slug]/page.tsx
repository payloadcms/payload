/* eslint-disable no-restricted-exports */
import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities/getPayloadHMR.js'
import { notFound } from 'next/navigation.js'
import React, { Fragment } from 'react'

import type { Page } from '../../../../../payload-types.js'

import { ssrPagesSlug } from '../../../../../shared.js'
import { Blocks } from '../../../_components/Blocks/index.js'
import { PostHero } from '../../../_heros/PostHero/index.js'
import { RefreshRouteOnSave } from './RefreshRouteOnSave.js'

export default async function Page({ params: { slug = '' } }) {
  const payload = await getPayloadHMR({ config })

  const res = await payload.find({
    collection: ssrPagesSlug,
    depth: 2,
    draft: true,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const data = res?.docs?.[0]

  if (!data) {
    notFound()
  }

  return (
    <Fragment>
      <RefreshRouteOnSave />
      <PostHero post={data} />
      <Blocks blocks={data?.layout} />
    </Fragment>
  )
}

export async function generateStaticParams() {
  process.env.PAYLOAD_DROP_DATABASE = 'false'
  const payload = await getPayloadHMR({ config })

  try {
    const { docs } = await payload.find({
      collection: ssrPagesSlug,
      depth: 0,
      limit: 100,
    })

    return docs?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

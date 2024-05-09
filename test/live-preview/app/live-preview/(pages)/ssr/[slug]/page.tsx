/* eslint-disable no-restricted-exports */
import { notFound } from 'next/navigation.js'
import React, { Fragment } from 'react'

import type { Page } from '../../../../../payload-types.js'

import { ssrPagesSlug } from '../../../../../shared.js'
import { getDoc } from '../../../_api/getDoc.js'
import { getDocs } from '../../../_api/getDocs.js'
import { Blocks } from '../../../_components/Blocks/index.js'
import { PostHero } from '../../../_heros/PostHero/index.js'
import { RefreshRouteOnSave } from './RefreshRouteOnSave.js'

export default async function SSRPage({ params: { slug = '' } }) {
  const data = await getDoc<Page>({
    slug,
    collection: ssrPagesSlug,
    draft: true,
  })

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
  try {
    const ssrPages = await getDocs<Page>(ssrPagesSlug)
    return ssrPages?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

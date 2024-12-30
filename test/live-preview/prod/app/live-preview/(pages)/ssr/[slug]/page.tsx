import { Gutter } from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import React, { Fragment } from 'react'

import type { Page } from '../../../../../../payload-types.js'

import { renderedPageTitleID, ssrPagesSlug } from '../../../../../../shared.js'
import { getDoc } from '../../../_api/getDoc.js'
import { getDocs } from '../../../_api/getDocs.js'
import { Blocks } from '../../../_components/Blocks/index.js'
import { Hero } from '../../../_components/Hero/index.js'
import { RefreshRouteOnSave } from './RefreshRouteOnSave.js'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function SSRPage({ params: paramsPromise }: Args) {
  const { slug = ' ' } = await paramsPromise
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
      <Hero {...data?.hero} />
      <Blocks blocks={data?.layout} />
      <Gutter>
        <div id={renderedPageTitleID}>{`For Testing: ${data.title}`}</div>
      </Gutter>
    </Fragment>
  )
}

export async function generateStaticParams() {
  process.env.PAYLOAD_DROP_DATABASE = 'false'
  try {
    const ssrPages = await getDocs<Page>(ssrPagesSlug)
    return ssrPages?.map(({ slug }) => slug)
  } catch (_err) {
    return []
  }
}

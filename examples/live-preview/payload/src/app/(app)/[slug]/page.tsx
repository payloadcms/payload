import { notFound } from 'next/navigation'
/* eslint-disable no-restricted-exports */
import { getPayload } from 'payload'
import React, { Fragment } from 'react'

import type { Page as PageType } from '../../../payload-types'

import config from '../../../payload.config'
import { Gutter } from '../_components/Gutter'
import RichText from '../_components/RichText'
import classes from './index.module.scss'
import { RefreshRouteOnSave } from './RefreshRouteOnSave'

interface PageParams {
  params: { slug: string }
}

export default async function Page({ params: { slug = 'home' } }: PageParams) {
  const payload = await getPayload({ config })

  const pageRes = await payload.find({
    collection: 'pages',
    draft: true,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const data = pageRes?.docs?.[0] as null | PageType

  if (data === null) {
    return notFound()
  }

  return (
    <Fragment>
      <RefreshRouteOnSave />
      <main className={classes.page}>
        <Gutter>
          <RichText content={data?.richText} />
        </Gutter>
      </main>
    </Fragment>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const pagesRes = await payload.find({
    collection: 'pages',
    depth: 0,
    draft: true,
    limit: 100,
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

/* eslint-disable no-restricted-exports */
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { notFound } from 'next/navigation'
import React from 'react'
import { Fragment } from 'react'

import type { Page } from '../../../payload-types'

import config from '../../../payload.config'
import { Gutter } from '../_components/Gutter'
import RichText from '../_components/RichText'
import { RefreshRouteOnSave } from './RefreshRouteOnSave'
import classes from './index.module.scss'

interface PageParams {
  params: { slug: string }
}

export default async function Page({ params: { slug = 'home' } }: PageParams) {
  const payload = await getPayloadHMR({ config })

  const page = await payload.find({
    collection: 'pages',
    draft: true,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })?.docs?.[0]

  if (page === null) {
    return notFound()
  }

  return (
    <Fragment>
      <RefreshRouteOnSave />
      <Gutter>
        <p>{`Title: ${page?.title}`}</p>
      </Gutter>
      <main className={classes.page}>
        <Gutter>
          <RichText content={page?.richText} />
        </Gutter>
      </main>
    </Fragment>
  )
}

export async function generateStaticParams() {
  const payload = await getPayloadHMR({ config })

  const pages =
    (await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 100,
    })?.docs) ?? []

  return pages.map(({ slug }) =>
    slug !== 'home'
      ? {
          slug,
        }
      : {},
  ) // eslint-disable-line function-paren-newline
}

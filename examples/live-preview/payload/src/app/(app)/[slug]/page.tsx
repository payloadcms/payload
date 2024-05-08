/* eslint-disable no-restricted-exports */
import { notFound } from 'next/navigation'
import React from 'react'
import { Fragment } from 'react'

import { getPage } from '../_api/getPage'
import { getPages } from '../_api/getPages'
import { Gutter } from '../_components/Gutter'
import RichText from '../_components/RichText'
import { RefreshRouteOnSave } from './RefreshRouteOnSave'
import classes from './index.module.scss'

interface PageParams {
  params: { slug: string }
}

export default async function Page({ params: { slug = 'home' } }: PageParams) {
  const page = await getPage(slug)

  if (page === null) {
    return notFound()
  }

  return (
    <Fragment>
      <RefreshRouteOnSave />
      <main className={classes.page}>
        <Gutter>
          <RichText content={page?.richText} />
        </Gutter>
      </main>
    </Fragment>
  )
}

export async function generateStaticParams() {
  const pages = await getPages()

  return pages.map(({ slug }) =>
    slug !== 'home'
      ? {
          slug,
        }
      : {},
  ) // eslint-disable-line function-paren-newline
}

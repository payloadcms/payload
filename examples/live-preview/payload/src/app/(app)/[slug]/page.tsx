import { notFound } from 'next/navigation'

import { getPage } from '../_api/getPage'
import { getPages } from '../_api/getPages'
import classes from './index.module.scss'
import { Gutter } from '../_components/Gutter'
import RichText from '../_components/RichText'
import { Fragment } from 'react'
import { RefreshRouteOnSave } from './RefreshRouteOnSave'

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

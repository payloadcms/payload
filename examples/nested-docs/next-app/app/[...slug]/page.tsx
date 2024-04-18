import React from 'react'
import { notFound } from 'next/navigation'

import { Page } from '../../payload-types'
import { Gutter } from '../_components/Gutter'
import RichText from '../_components/RichText'

import classes from './index.module.scss'

interface PageParams {
  params: { slug: string[] }
}

export const PageTemplate: React.FC<{ page: Page | null | undefined }> = ({ page }) => (
  <main className={classes.page}>
    <Gutter>
      <h1>{page?.title}</h1>
      <RichText content={page?.richText} />
    </Gutter>
  </main>
)

export default async function Page({ params }: PageParams) {
  let { slug } = params || {}
  if (!slug) slug = ['home']

  const fullPathSlug = slug.join('/');

  const page: Page = await fetch(
    `${
      process.env.NEXT_PUBLIC_PAYLOAD_URL
    }/api/pages?where[slug][equals]=${fullPathSlug.toLowerCase()}&depth=1`,
  )?.then(res => res.json()?.then(data => data.docs[0]))

  if (!page) {
    return notFound()
  }

  return <PageTemplate page={page} />
}

type Path = {
  slug: string[]
}

type Paths = Path[]

export async function generateStaticParams() {
  let paths: Paths = []

  const pages: Page[] = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?depth=0&limit=300`,
  )?.then(res => res.json()?.then(data => data.docs))

  if (pages && Array.isArray(pages) && pages.length > 0) {
    paths = pages.map(page => {
      const { slug, breadcrumbs } = page

      let slugs = [slug]

      const hasBreadcrumbs = breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0

      if (hasBreadcrumbs) {
        slugs = breadcrumbs
          .map(crumb => {
            const { url } = crumb
            let slug: string = ''

            if (url) {
              const split = url.split('/')
              slug = split[split.length - 1]
            }

            return slug
          })
          ?.filter(Boolean)
      }

      return { slug: slugs }
    })
  }

  return paths
}

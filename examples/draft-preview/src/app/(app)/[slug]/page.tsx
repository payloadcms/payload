import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import type { Page as PageType } from '../../../payload-types'

import { Gutter } from '../../../components/Gutter'
import RichText from '../../../components/RichText'
import classes from './index.module.scss'

export async function generateStaticParams() {
  const payload = await getPayloadHMR({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
  })

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}
export const PageTemplate: React.FC<{ page: null | PageType | undefined }> = ({ page }) => (
  <main className={classes.page}>
    <Gutter>
      <h1>{page?.title}</h1>
      <RichText content={page?.richText} />
    </Gutter>
  </main>
)

type Args = {
  params: Promise<{
    slug?: string
  }>
}

// eslint-disable-next-line no-restricted-exports
export default async function Page({ params: paramsPromise }: Args) {
  const { slug = 'home' } = await paramsPromise

  const page: null | PageType = await queryPageBySlug({
    slug,
  })

  if (page === null) {
    return notFound()
  }

  return <PageTemplate page={page} />
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayloadHMR({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

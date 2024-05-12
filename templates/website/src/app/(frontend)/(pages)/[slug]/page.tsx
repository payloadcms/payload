import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import type { Page } from '../../../../payload-types'

import { Blocks } from '../../../_components/Blocks'
import { Hero } from '../../../_components/Hero'
import { PayloadRedirects } from '../../../_components/PayloadRedirects'
import { generateMeta } from '../../../_utilities/generateMeta'

// Could abstract this, keeping it explicit for example sake
const getCachedGetPageBySlug = ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = draftMode()

  return unstable_cache<() => Promise<Page>>(
    async () => {
      const payload = await getPayload({ config: configPromise })
      const result = await payload.find({
        collection: 'pages',
        draft,
        limit: 1,
        where: {
          slug: {
            equals: slug,
          },
        },
      })

      return result.docs?.[0] || null
    },
    [`pages_${slug}_${draft}`],
    {
      tags: [`pages_${slug}`],
    },
  )
}

// eslint-disable-next-line no-restricted-exports
export default async function Page({ params: { slug = 'home' } }) {
  const url = '/' + slug
  const page = await getCachedGetPageBySlug({
    slug,
  })()

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  return (
    <React.Fragment>
      <PayloadRedirects url={url} />
      <Hero {...hero} />
      <Blocks
        blocks={layout}
        disableTopPadding={!hero || hero?.type === 'none' || hero?.type === 'lowImpact'}
      />
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    limit: 1000,
  })

  return pages.docs?.map(({ slug }) => slug)
}

export async function generateMetadata({ params: { slug = 'home' } }): Promise<Metadata> {
  const page = await getCachedGetPageBySlug({
    slug,
  })()

  return generateMeta({ doc: page })
}

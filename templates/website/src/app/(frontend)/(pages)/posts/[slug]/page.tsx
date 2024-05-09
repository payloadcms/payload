import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import RichText from 'src/app/_components/RichTextLexical'

import type { Post } from '../../../../../payload-types'

import { Blocks } from '../../../../_components/Blocks'
import { PayloadRedirects } from '../../../../_components/PayloadRedirects'
import { PremiumContent } from '../../../../_components/PremiumContent'
import { PostHero } from '../../../../_heros/PostHero'
import { generateMeta } from '../../../../_utilities/generateMeta'

const getCachedGetPostBySlug = async ({
  slug,
  draft,
}: {
  draft: boolean
  slug: string
}): Promise<Post | null> => {
  const payload = await getPayload({ config: configPromise })

  const pages = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return pages.docs?.[0] || null
}

export default async function Post({ params: { slug } }) {
  const url = '/posts/' + slug
  const { isEnabled: draft } = draftMode()

  const payload = await getPayload({ config: configPromise })
  const post = await getCachedGetPostBySlug({ slug, draft })

  if (!post) {
    notFound()
  }

  const { content, relatedPosts } = post

  return (
    <React.Fragment>
      <PayloadRedirects url={url} />
      <PostHero post={post} />
      <RichText content={content} />
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
  })

  return posts.docs?.map(({ slug }) => slug)
}

export async function generateMetadata({ params: { slug } }): Promise<Metadata> {
  const { isEnabled: draft } = draftMode()
  const post = await getCachedGetPostBySlug({ slug, draft })

  return generateMeta({ doc: post })
}

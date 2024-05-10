import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import RichText from 'src/app/_components/RichTextLexical'

import type { Post } from '../../../../../payload-types'

import { PayloadRedirects } from '../../../../_components/PayloadRedirects'
import { PostHero } from '../../../../_heros/PostHero'
import { generateMeta } from '../../../../_utilities/generateMeta'

// Could abstract this, keeping it explicit for example sake
const getCachedGetPostBySlug = ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = draftMode()

  return unstable_cache<() => Promise<Post>>(
    async () => {
      const payload = await getPayload({ config: configPromise })
      const result = await payload.find({
        collection: 'posts',
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
    [`posts_${slug}_${draft}`],
    {
      tags: [`pages_${slug}`],
    },
  )
}

// eslint-disable-next-line no-restricted-exports
export default async function Post({ params: { slug = '' } }) {
  const url = '/posts/' + slug
  const post = await getCachedGetPostBySlug({ slug })()

  if (!post) {
    notFound()
  }

  return (
    <React.Fragment>
      <PayloadRedirects url={url} />
      <PostHero post={post} />
      <RichText content={post.content} />
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
  const post = await getCachedGetPostBySlug({ slug })()

  return generateMeta({ doc: post })
}

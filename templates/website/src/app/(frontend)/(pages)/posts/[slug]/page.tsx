import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import RichText from 'src/app/_components/RichText'

import type { Post } from '../../../../../payload-types'

import { PayloadRedirects } from '../../../../_components/PayloadRedirects'
import { PostHero } from '../../../../_heros/PostHero'
import { generateMeta } from '../../../../_utilities/generateMeta'

const queryPostBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = draftMode()

  const payload = await getPayload({ config: configPromise })
  const user = draft ? await payload.auth({ headers: headers() }) : undefined

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: false,
    user,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
}

export default async function Post({ params: { slug = '' } }) {
  const url = '/posts/' + slug
  const post = await queryPostBySlug({ slug })

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
    draft: false,
    limit: 1000,
    overrideAccess: false,
  })

  return posts.docs?.map(({ slug }) => slug)
}

export async function generateMetadata({ params: { slug } }): Promise<Metadata> {
  const post = await queryPostBySlug({ slug })

  return generateMeta({ doc: post })
}

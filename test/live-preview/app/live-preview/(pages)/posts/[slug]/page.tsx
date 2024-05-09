/* eslint-disable no-restricted-exports */
import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities/getPayloadHMR.js'
import { notFound } from 'next/navigation.js'
import React from 'react'

import type { Post } from '../../../../../payload-types.js'

import { postsSlug } from '../../../../../shared.js'
import { PostClient } from './page.client.js'

export default async function Post({ params: { slug = '' } }) {
  const payload = await getPayloadHMR({ config })

  const res = await payload.find({
    collection: postsSlug,
    depth: 2,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const post = res?.docs?.[0]

  if (!post) {
    notFound()
  }

  return <PostClient post={post} />
}

export async function generateStaticParams() {
  process.env.PAYLOAD_DROP_DATABASE = 'false'
  const payload = await getPayloadHMR({ config })

  try {
    const { docs } = await payload.find({
      collection: postsSlug,
      depth: 0,
      limit: 100,
    })

    return docs?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

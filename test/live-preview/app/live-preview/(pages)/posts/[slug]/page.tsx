import { notFound } from 'next/navigation.js'
import React from 'react'

import type { Post } from '../../../../../payload-types.js'

import { fetchDoc } from '../../../_api/fetchDoc.js'
import { fetchDocs } from '../../../_api/fetchDocs.js'
import { PostClient } from './page.client.js'

export default async function Post({ params: { slug = '' } }) {
  let post: Post | null = null

  try {
    post = await fetchDoc<Post>({
      slug,
      collection: 'posts',
    })
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }

  if (!post) {
    notFound()
  }

  return <PostClient post={post} />
}

export async function generateStaticParams() {
  process.env.PAYLOAD_DROP_DATABASE = 'false'
  try {
    const posts = await fetchDocs<Post>('posts')
    return posts?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

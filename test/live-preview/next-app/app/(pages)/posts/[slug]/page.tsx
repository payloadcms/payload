import React from 'react'
import { notFound } from 'next/navigation'

import { Post } from '../../../../payload-types'
import { fetchDoc } from '../../../_api/fetchDoc'
import { fetchDocs } from '../../../_api/fetchDocs'
import { PostClient } from './page.client'

export default async function Post({ params: { slug = '' } }) {
  let post: Post | null = null

  try {
    post = await fetchDoc<Post>({
      collection: 'posts',
      slug,
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
  try {
    const posts = await fetchDocs<Post>('posts')
    return posts?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

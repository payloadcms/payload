import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import { cache } from 'react'

import { RenderBlocks } from '@/components/blocks/index'
import { RichText } from '@/components/RichText/index'
import type { Post } from '@/payload-types'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await findPublishedPost(slug)
  return post
    ? { title: post.title, description: `Read ${post.title}` }
    : { title: 'Post not found' }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await findPublishedPost(slug)
  if (!post) notFound()
  const categoryTitles = (post.categories ?? []).flatMap((category) =>
    typeof category === 'object' && category.title ? [category.title] : [],
  )
  return (
    <article>
      <header className="template-post__header">
        <Link className="template-post__back" href="/">
          ← Back home
        </Link>
        <div className="template-post__tags">
          {categoryTitles.map((title) => (
            <span className="template-post__tag" key={title}>
              {title}
            </span>
          ))}
        </div>
      </header>
      <div className="template-post__intro">
        <h1>{post.title}</h1>
        <div className="template-post__meta">
          /{post.slug} · Last updated: {new Date(post.updatedAt).toLocaleDateString()}
        </div>
      </div>
      <RichText data={post.content} />
      <RenderBlocks blocks={post.layout} />
    </article>
  )
}

const findPublishedPost = cache(async (slug: string): Promise<Post | null> => {
  if (!slug || typeof slug !== 'string') return null
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    overrideAccess: false,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
})

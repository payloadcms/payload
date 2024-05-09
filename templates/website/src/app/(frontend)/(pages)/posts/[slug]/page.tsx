import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

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

  const comments = await payload.find({
    collection: 'comments',
    where: {
      doc: {
        equals: post.id,
      },
    },
  })

  const { enablePremiumContent, layout, premiumContent, relatedPosts } = post

  return (
    <React.Fragment>
      <PayloadRedirects url={url} />
      <PostHero post={post} />
      <Blocks blocks={layout} />
      {enablePremiumContent && <PremiumContent disableTopPadding postSlug={slug as string} />}
      <Blocks
        blocks={[
          {
            blockName: 'Comments',
            blockType: 'comments',
            comments: comments.docs,
            doc: post,
            introContent: [
              {
                type: 'h4',
                children: [
                  {
                    text: 'Comments',
                  },
                ],
              },
              {
                type: 'p',
                children: [
                  {
                    text: 'Authenticated users can leave comments on this post. All new comments are given the status "draft" until they are approved by an admin. Draft comments are not accessible to the public and will not show up on this page until it is marked as "published". To manage all comments, ',
                  },
                  {
                    type: 'link',
                    children: [
                      {
                        text: 'navigate to the admin dashboard',
                      },
                    ],
                    url: '/admin/collections/comments',
                  },
                  {
                    text: '.',
                  },
                ],
              },
            ],
            relationTo: 'posts',
          },
          {
            blockName: 'Related Posts',
            blockType: 'relatedPosts',
            docs: relatedPosts,
            introContent: [
              {
                type: 'h4',
                children: [
                  {
                    text: 'Related posts',
                  },
                ],
              },
              {
                type: 'p',
                children: [
                  {
                    text: 'The posts displayed here are individually selected for this page. Admins can select any number of related posts to display here and the layout will adjust accordingly. Alternatively, you could swap this out for the "Archive" block to automatically populate posts by category complete with pagination. To manage related posts, ',
                  },
                  {
                    type: 'link',
                    children: [
                      {
                        text: 'navigate to the admin dashboard',
                      },
                    ],
                    url: `/admin/collections/posts/${post.id}`,
                  },
                  {
                    text: '.',
                  },
                ],
              },
            ],
            relationTo: 'posts',
          },
        ]}
        disableTopPadding
      />
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

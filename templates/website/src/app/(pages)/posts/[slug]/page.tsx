import React from 'react'
import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { Comment, Post } from '../../../../payload/payload-types'
import { fetchComments } from '../../../_api/fetchComments'
import { fetchDoc } from '../../../_api/fetchDoc'
import { fetchDocs } from '../../../_api/fetchDocs'
import { Blocks } from '../../../_components/Blocks'
import { PremiumContent } from '../../../_components/PremiumContent'
import { PostHero } from '../../../_heros/PostHero'
import { generateMeta } from '../../../_utilities/generateMeta'

// Force this page to be dynamic so that Next.js does not cache it
// See the note in '../../../[slug]/page.tsx' about this
export const dynamic = 'force-dynamic'

export default async function Post({ params: { slug } }) {
  const { isEnabled: isDraftMode } = draftMode()

  let post: Post | null = null

  try {
    post = await fetchDoc<Post>({
      collection: 'posts',
      slug,
      draft: isDraftMode,
    })
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }

  if (!post) {
    notFound()
  }

  const comments = await fetchComments({
    doc: post?.id,
  })

  const { layout, relatedPosts, enablePremiumContent, premiumContent } = post

  return (
    <React.Fragment>
      <PostHero post={post} />
      <Blocks blocks={layout} />
      {enablePremiumContent && <PremiumContent postSlug={slug as string} disableTopPadding />}
      <Blocks
        disableTopPadding
        blocks={[
          {
            blockType: 'comments',
            blockName: 'Comments',
            relationTo: 'posts',
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
                    url: '/admin/collections/comments',
                    children: [
                      {
                        text: 'navigate to the admin dashboard',
                      },
                    ],
                  },
                  {
                    text: '.',
                  },
                ],
              },
            ],
            doc: post,
            comments,
          },
          {
            blockType: 'relatedPosts',
            blockName: 'Related Posts',
            relationTo: 'posts',
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
                    url: `/admin/collections/posts/${post.id}`,
                    children: [
                      {
                        text: 'navigate to the admin dashboard',
                      },
                    ],
                  },
                  {
                    text: '.',
                  },
                ],
              },
            ],
            docs: relatedPosts,
          },
        ]}
      />
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  try {
    const posts = await fetchDocs<Post>('posts')
    return posts?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

export async function generateMetadata({ params: { slug } }): Promise<Metadata> {
  const { isEnabled: isDraftMode } = draftMode()

  let post: Post | null = null

  try {
    post = await fetchDoc<Post>({
      collection: 'posts',
      slug,
      draft: isDraftMode,
    })
  } catch (error) {}

  return generateMeta({ doc: post })
}

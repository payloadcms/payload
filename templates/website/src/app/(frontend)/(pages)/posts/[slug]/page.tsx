import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'

import type { Post } from '../../../../../payload-types'

import { Comment } from '../../../../../payload-types'
import { fetchComments } from '../../../../_api/fetchComments'
import { fetchDoc } from '../../../../_api/fetchDoc'
import { fetchDocs } from '../../../../_api/fetchDocs'
import { Blocks } from '../../../../_components/Blocks'
import { PayloadRedirects } from '../../../../_components/PayloadRedirects'
import { PremiumContent } from '../../../../_components/PremiumContent'
import { PostHero } from '../../../../_heros/PostHero'
import { generateMeta } from '../../../../_utilities/generateMeta'

// Force this page to be dynamic so that Next.js does not cache it
// See the note in '../../../[slug]/page.tsx' about this
export const dynamic = 'force-dynamic'

export default async function Post({ params: { slug } }) {
  const url = '/posts/' + slug.join('/')
  const { isEnabled: isDraftMode } = draftMode()

  let post: Post | null = null

  try {
    post = await fetchDoc<Post>({
      slug,
      collection: 'posts',
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
            comments,
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
      slug,
      collection: 'posts',
      draft: isDraftMode,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  return generateMeta({ doc: post })
}

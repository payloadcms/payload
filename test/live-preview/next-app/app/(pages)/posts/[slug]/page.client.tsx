'use client'

import { Post as PostType } from '@/payload-types'
import { useLivePreview } from '../../../../../../../packages/live-preview-react/src'
import React from 'react'
import { PAYLOAD_SERVER_URL } from '@/app/_api/serverURL'
import { Blocks } from '@/app/_components/Blocks'
import { PostHero } from '@/app/_heros/PostHero'

export type PostClientProps = {
  post: PostType
}

export const PostClient = ({ post: initialPost }: PostClientProps) => {
  const { data } = useLivePreview<PostType>({
    initialData: initialPost,
    serverURL: PAYLOAD_SERVER_URL,
    depth: 2,
  })

  return (
    <React.Fragment>
      <PostHero post={data} />
      <Blocks blocks={data?.layout} />
      <Blocks
        disableTopPadding
        blocks={[
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
                    url: `/admin/collections/posts/${data?.id}`,
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
            docs: data?.relatedPosts,
          },
        ]}
      />
    </React.Fragment>
  )
}

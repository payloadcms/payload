'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { Gutter } from '@payloadcms/ui'
import React from 'react'

import type { Post as PostType } from '../../../../../payload-types.js'

import { postsSlug, renderedPageTitleID } from '../../../../../shared.js'
import { PAYLOAD_SERVER_URL } from '../../../_api/serverURL.js'
import { Blocks } from '../../../_components/Blocks/index.js'
import { PostHero } from '../../../_heros/PostHero/index.js'

export const PostClient: React.FC<{
  post: PostType
}> = ({ post: initialPost }) => {
  const { data } = useLivePreview<PostType>({
    depth: 2,
    initialData: initialPost,
    serverURL: PAYLOAD_SERVER_URL,
  })

  return (
    <React.Fragment>
      <PostHero post={data} />
      <Blocks blocks={data?.layout} />
      <Blocks
        blocks={[
          {
            blockName: 'Related Posts',
            blockType: 'relatedPosts',
            docs: data?.relatedPosts,
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
                    url: `/admin/collections/posts/${data?.id}`,
                  },
                  {
                    text: '.',
                  },
                ],
              },
            ],
            relationTo: postsSlug,
          },
        ]}
        disableTopPadding
      />
      <Gutter>
        <div id={renderedPageTitleID}>{`For Testing: ${data.title}`}</div>
      </Gutter>
    </React.Fragment>
  )
}

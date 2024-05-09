/* eslint-disable no-restricted-exports */
import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { notFound } from 'next/navigation.js'
import React, { Fragment } from 'react'

import type { Post } from '../../../../../payload-types.js'

import { ssrPostsSlug } from '../../../../../shared.js'
import { renderedPageTitleID } from '../../../../../shared.js'
import { fetchDoc } from '../../../_api/fetchDoc.js'
import { fetchDocs } from '../../../_api/fetchDocs.js'
import { Blocks } from '../../../_components/Blocks/index.js'
import { PostHero } from '../../../_heros/PostHero/index.js'
import { RefreshRouteOnSave } from './RefreshRouteOnSave.js'

export default async function SSRPost({ params: { slug = '' } }) {
  let data: Post | null = null

  try {
    data = await fetchDoc<Post>({
      slug,
      collection: ssrPostsSlug,
      draft: true,
    })
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }

  if (!data) {
    notFound()
  }

  return (
    <Fragment>
      <RefreshRouteOnSave />
      <Gutter>
        <div id={renderedPageTitleID}>{data.title}</div>
      </Gutter>
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
                    url: `/admin/collections/ssr/${data?.id}`,
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
    </Fragment>
  )
}

export async function generateStaticParams() {
  process.env.PAYLOAD_DROP_DATABASE = 'false'
  try {
    const ssrPosts = await fetchDocs<Post>(ssrPostsSlug)
    return ssrPosts?.map(({ slug }) => slug)
  } catch (error) {
    return []
  }
}

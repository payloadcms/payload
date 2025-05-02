import type { Page } from '../payload-types.js'

import { postsSlug } from '../shared.js'

export const postsPage: Partial<Page> = {
  title: 'Posts',
  slug: 'posts',
  meta: {
    title: 'Payload Website Template',
    description: 'An open-source website built with Payload and Next.js.',
    image: '{{IMAGE}}',
  },
  hero: {
    type: 'lowImpact',
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'All posts',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This is an example of live preview on a page. You can edit this page in the admin panel and see the changes reflected here.',
          },
        ],
      },
    ],
    media: undefined,
  },
  layout: [
    {
      blockName: 'Archive Block',
      blockType: 'archive',
      introContent: [
        {
          type: 'h4',
          children: [
            {
              text: 'All posts',
            },
          ],
        },
        {
          type: 'p',
          children: [
            {
              text: 'This is a custom layout building block. You can edit this block in the admin panel and see the changes reflected here.',
            },
          ],
        },
      ],
      populateBy: 'collection',
      relationTo: postsSlug,
      limit: 10,
      categories: [],
    },
  ],
}

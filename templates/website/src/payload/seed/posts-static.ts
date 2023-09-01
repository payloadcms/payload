import type { Page } from '../payload-types'

export const staticPosts: Page = {
  id: '',
  title: 'Posts',
  slug: 'posts',
  createdAt: '',
  updatedAt: '',
  meta: {
    title: 'Payload Website Template',
    description: 'An open-source website built with Payload and Next.js.',
  },
  hero: {
    type: 'lowImpact',
    links: null,
    richText: [
      {
        children: [
          {
            text: 'Posts',
          },
        ],
        type: 'h1',
      },
    ],
    media: '',
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
              text: 'The posts below are displayed in an "Archive" layout building block which is an extremely powerful way to display docs on a page. It can be auto-populated by collection, filtered by category, and much more.',
            },
          ],
        },
      ],
      populateBy: 'collection',
      relationTo: 'posts',
      limit: 10,
      categories: [],
    },
  ],
}

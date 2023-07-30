import type { Page } from '../payload-types'

export const postsPage: Partial<Page> = {
  title: 'Posts',
  slug: 'posts',
  _status: 'published',
  meta: {
    title: 'All posts',
    description: 'Browse all posts in the blog',
  },
  hero: {
    media: null,
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
            // text: 'This page displays all or some of the products of your store ranging from goods and services to digital assets and gated content. Each product is complete with a dynamic page layout builder for a completely custom shopping experience that is under your full control.',
          },
        ],
      },
    ],
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
              // text: 'The products below are displayed in an "Archive" layout building block which is an extremely powerful way to display docs on a page. It can be auto-populated by collection, filtered by category, and much more.',
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

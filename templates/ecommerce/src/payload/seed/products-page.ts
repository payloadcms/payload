import type { Page } from '../payload-types'

export const productsPage: Omit<Page, 'createdAt' | 'id' | 'updatedAt'> = {
  slug: 'products',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    media: null,
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'All products',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This page displays all or some of the products of your store ranging from goods and services to digital assets and gated content. Each product is complete with a dynamic page layout builder for a completely custom shopping experience that is under your full control.',
          },
        ],
      },
    ],
  },
  layout: [
    {
      blockName: 'Archive Block',
      blockType: 'archive',
      categories: [],
      introContent: [
        {
          type: 'h4',
          children: [
            {
              text: 'All products',
            },
          ],
        },
        {
          type: 'p',
          children: [
            {
              text: 'The products below are displayed in an "Archive" layout building block which is an extremely powerful way to display docs on a page. It can be auto-populated by collection, filtered by category, and much more.',
            },
          ],
        },
      ],
      limit: 10,
      populateBy: 'collection',
      relationTo: 'products',
    },
  ],
  meta: {
    description: 'Shop everything from goods and services to digital assets and gated content.',
    title: 'Shop all products',
  },
  title: 'Products',
}

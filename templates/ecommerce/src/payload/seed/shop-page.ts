export const shopPage = {
  title: 'Shop',
  hero: {
    type: 'lowImpact',
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'Shop',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This page displays all or some of the products of your store—ranging from goods and services to digital assets and gated content. Each product is complete with a dynamic page layout builder for a completely custom shopping experience that you fully control from the CMS.',
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
              text: 'All products',
            },
          ],
        },
        {
          type: 'p',
          children: [
            {
              text: 'The products below are displayed in an "Archive" layout building block which is an extremely powerful way to display docs on a page. It can auto-populate by collection, filter by category, limit results, and much more—all configured in the CMS.',
            },
          ],
        },
      ],
      populateBy: 'collection',
      relationTo: 'products',
      limit: 10,
      categories: [],
    },
  ],
  meta: {
    title: 'Shop',
    description: 'Shop page',
  },
  slug: 'shop',
  _status: 'published',
}

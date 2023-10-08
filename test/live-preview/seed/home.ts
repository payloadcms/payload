import type { Page } from '../payload-types'

export const home: Page = {
  slug: 'home',
  title: 'Home',
  id: '',
  meta: {
    description: 'This is an example of live preview on a page.',
  },
  hero: {
    type: 'highImpact',
    richText: [
      {
        type: 'h1',
        children: [{ text: 'Hello, world!' }],
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
    media: '{{MEDIA_ID}}',
  },
  layout: [
    {
      blockType: 'archive',
      populateBy: 'selection',
      selectedDocs: [
        {
          relationTo: 'posts',
          value: '{{POST_1_ID}}',
        },
        {
          relationTo: 'posts',
          value: '{{POST_2_ID}}',
        },
        {
          relationTo: 'posts',
          value: '{{POST_3_ID}}',
        },
      ],
      introContent: [
        {
          type: 'h2',
          children: [{ text: 'Recent Posts' }],
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
    },
    {
      blockType: 'cta',
      blockName: 'CTA',
      richText: [
        {
          children: [
            {
              text: 'This is a call to action',
            },
          ],
          type: 'h4',
        },
        {
          children: [
            {
              text: 'This is a custom layout building block. You can edit this block in the admin panel and see the changes reflected here.',
            },
          ],
        },
      ],
      links: [
        {
          link: {
            type: 'reference',
            url: '',
            label: 'All posts',
            appearance: 'primary',
            reference: {
              value: '{{POSTS_PAGE_ID}}',
              relationTo: 'pages',
            },
          },
        },
      ],
    },
  ],
}

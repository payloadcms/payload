import type { Page } from '../payload-types'

export const home: Page = {
  slug: 'home',
  title: 'Home',
  id: '',
  updatedAt: '',
  createdAt: '',
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
      ],
      introContent: [
        {
          type: 'h1',
          children: [{ text: 'Recent Posts' }],
        },
        {
          type: 'p',
          children: [
            {
              text: 'The posts below are displayed in an "Archive" layout building block which is an extremely powerful way to display documents on a page. It can be auto-populated by collection or by category, or posts can be individually selected. Pagination controls will automatically appear if the number of results exceeds the number of items per page.',
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
              text: 'This is a custom layout building block. This text can be anything you want.',
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
              value: '{{POST_1_ID}}',
              relationTo: 'posts',
            },
          },
        },
      ],
    },
  ],
}

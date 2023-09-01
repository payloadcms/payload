import type { Page } from '../payload-types'

export const staticProjects: Page = {
  id: '',
  title: 'Projects',
  slug: 'projects',
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
            text: 'Projects',
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
              text: 'All projects',
            },
          ],
        },
        {
          type: 'p',
          children: [
            {
              text: 'The projects below are displayed in an "Archive" layout building block which is an extremely powerful way to display docs on a page. It can be auto-populated by collection, filtered by category, and much more.',
            },
          ],
        },
      ],
      populateBy: 'collection',
      relationTo: 'projects',
      limit: 10,
      categories: [],
    },
  ],
}

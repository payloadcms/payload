import type { Page } from '../payload-types'

export const projectsPage: Partial<Page> = {
  slug: 'projects',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    media: undefined,
    richText: [
      {
        type: 'h1',
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
            text: 'This page displays all or some of the projects of your portfolio. Each project is complete with a dynamic page layout builder for a completely custom user experience that is under your full control.',
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
              text: 'All projects',
            },
          ],
        },
        {
          type: 'p',
          children: [
            {
              text: 'The projects below are displayed in an "Archive" layout building block which is an extremely powerful way to display documents on a page. It can be auto-populated by collection or by category, or projects can be individually selected. Pagination controls will automatically appear if the number of results exceeds the number of items per page.',
            },
          ],
        },
      ],
      limit: 10,
      populateBy: 'collection',
      relationTo: 'projects',
    },
  ],
  meta: {
    description: 'An open-source website built with Payload and Next.js.',
    image: '{{IMAGE}}',
    title: 'Payload Website Template',
  },
  title: 'Projects',
}

import type { Project } from '../payload-types'

export const project2: Partial<Project> = {
  title: 'Project 2',
  slug: 'project-2',
  _status: 'published',
  meta: {
    title: 'Project 2',
    description: 'This is project 2',
    image: '{{PROJECT_IMAGE}}',
  },

  hero: {
    type: 'lowImpact',
    links: [],
    media: '',
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'Project 2',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This is project 2. This hero and the content on this page is completely dynamic and ',
          },
          {
            type: 'link',
            linkType: 'custom',
            url: '/admin',
            children: [
              {
                text: 'configured in the admin dashboard',
              },
            ],
          },
        ],
      },
    ],
  },
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'twoThirds',
          richText: [
            {
              children: [
                {
                  text: "All content from this point is completely dynamic using custom layout building block configured in the CMS. This can be anything you'd like.",
                },
              ],
            },
          ],
          link: {
            reference: {
              relationTo: 'pages',
              value: '',
            },
            url: '',
            label: '',
          },
        },
      ],
    },
  ],
}

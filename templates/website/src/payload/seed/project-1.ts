import type { Project } from '../payload-types'
export const project1: Partial<Project> = {
  title: 'Project 1',
  slug: 'project-1',
  _status: 'published',
  meta: {
    title: 'Project 1',
    description: 'This is the first project.',
    image: '{{IMAGE}}',
  },
  hero: {
    type: 'lowImpact',
    links: null,
    richText: [
      {
        children: [
          {
            text: 'Project 1',
          },
        ],
        type: 'h1',
      },
    ],
    media: null,
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
  relatedProjects: [], // this is populated by the seed script
}

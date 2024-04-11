import type { Project } from '../payload-types'

export const project2: Partial<Project> = {
  slug: 'project-2',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    links: null,
    media: null,
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'Project 2',
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
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              children: [
                {
                  text: "This content is completely dynamic using custom layout building blocks configured in the CMS. This can be anything you'd like from rich text and images, to highly designed, complex components.",
                },
              ],
            },
          ],
          size: 'twoThirds',
        },
      ],
    },
  ],
  meta: {
    description: 'This is the second project.',
    image: '{{IMAGE}}',
    title: 'Project 2',
  },
  relatedProjects: [], // this is populated by the seed script
  title: 'Project 2',
}

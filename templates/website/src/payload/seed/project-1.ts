import type { Project } from '../payload-types'

export const project1: Partial<Project> = {
  title: 'Cotton T-Shirt',
  slug: 'cotton-t',
  _status: 'published',
  meta: {
    title: 'Cotton T-Shirt',
    description: 'Make a one-time purchase for this physical product.',
    image: '{{PROJECT_IMAGE}}',
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

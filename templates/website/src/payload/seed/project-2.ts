import type { Project } from '../payload-types'

export const project2: Partial<Project> = {
  title: 'E-Book',
  slug: 'ebook',
  _status: 'published',
  meta: {
    title: 'E-Book',
    description: 'Make a one-time purchase for this digital asset.',
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
            {
              children: [
                {
                  text: 'Purchase this product to gain access to the gated content behind the paywall which will appear below.',
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

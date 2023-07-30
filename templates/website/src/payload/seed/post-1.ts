import type { Post } from '../payload-types'

export const post1: Partial<Post> = {
  title: 'Cotton T-Shirt',
  slug: 'cotton-t',
  _status: 'published',
  meta: {
    title: 'Cotton T-Shirt',
    description: 'Make a one-time purchase for this physical product.',
    image: '{{POST_IMAGE}}',
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

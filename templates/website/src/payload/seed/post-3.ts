import type { Post } from '../payload-types'

export const post3: Partial<Post> = {
  title: 'Post 3',
  slug: 'post-3',
  _status: 'published',
  meta: {
    title: 'Post 3',
    description: 'This is post 3',
    image: '{{POST_IMAGE}}',
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
            text: 'Post 3',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This is post 3. This hero and the content on this page is completely dynamic and ',
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

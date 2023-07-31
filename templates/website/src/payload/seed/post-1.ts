import type { Post } from '../payload-types'

export const post1: Partial<Post> = {
  title: 'Post 1',
  slug: 'post-1',
  _status: 'published',
  meta: {
    title: 'Post 1',
    description: 'This is post 1',
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
            text: 'Post 1',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This is post 1. This hero and the content on this page is completely dynamic and ',
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

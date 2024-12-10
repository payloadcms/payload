import type { Post } from '../payload-types.js'

export const post2: Omit<Post, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Post 2',
  slug: 'post-2',
  meta: {
    title: 'Post 2',
    description: 'This is the second post.',
    image: '{{IMAGE}}',
  },
  tenant: '{{TENANT_1_ID}}',
  hero: {
    type: 'lowImpact',
    richText: [
      {
        children: [
          {
            text: 'Post 2',
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
                  text: "This content is completely dynamic using custom layout building blocks configured in the CMS. This can be anything you'd like from rich text and images, to highly designed, complex components.",
                },
              ],
            },
          ],
          link: {
            type: 'custom',
            url: '',
            label: '',
          },
        },
      ],
    },
  ],
  relatedPosts: [], // this is populated by the seed script
}

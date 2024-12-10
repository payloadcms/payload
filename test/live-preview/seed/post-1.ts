import type { Post } from '../payload-types.js'
export const post1: Omit<Post, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Post 1',
  slug: 'post-1',
  meta: {
    title: 'Post 1',
    description: 'This is the first post.',
    image: '{{IMAGE}}',
  },
  tenant: '{{TENANT_1_ID}}',
  hero: {
    type: 'lowImpact',
    richText: [
      {
        children: [
          {
            text: 'Post 1',
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

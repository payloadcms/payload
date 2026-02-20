import type { Post } from '../payload-types.js'

export const trashedPost: Omit<Post, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Trashed Post',
  slug: 'trashed-post',
  meta: {
    title: 'Trashed Post',
    description: 'This is a trashed post.',
    image: '{{IMAGE}}',
  },
  tenant: '{{TENANT_1_ID}}',
  hero: {
    type: 'lowImpact',
    richText: [
      {
        children: [
          {
            text: 'Trashed Post',
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
  deletedAt: new Date().toISOString(), // Marking the post as trashed
}

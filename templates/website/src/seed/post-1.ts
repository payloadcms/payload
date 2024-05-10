// @ts-nocheck
import type { Post } from '../payload-types'
export const post1: Partial<Post> = {
  slug: 'post-1',
  _status: 'published',
  authors: ['{{AUTHOR}}'],
  enablePremiumContent: true,
  hero: {
    type: 'lowImpact',
    links: null,
    media: null,
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'Post 1',
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
    description: 'This is the first post.',
    image: '{{IMAGE}}',
    title: 'Post 1',
  },
  premiumContent: [
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
                  bold: true,
                  text: 'This is premium content.',
                },
                {
                  text: ' It is only available to authenticated users. This content can be anything from additional video, text, and content, to download links and more. These are simply layout building blocks configured in the CMS.',
                },
              ],
            },
          ],
          size: 'twoThirds',
        },
      ],
    },
  ],
  relatedPosts: [], // this is populated by the seed script
  title: 'Post 1',
}

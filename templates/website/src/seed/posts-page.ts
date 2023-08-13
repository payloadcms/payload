import type { Page } from '../payload-types'

export const posts: Partial<Page> = {
  title: 'Posts',
  slug: 'posts',
  _status: 'published',
  hero: {
    type: 'highImpact',
    richText: [
      {
        children: [
          {
            text: 'All Posts',
          },
        ],
        type: 'h1',
      },
    ],
    links: [
      {
        link: {
          type: 'custom',
          appearance: 'secondary',
          reference: null,
          label: 'View on GitHub',
          url: 'https://github.com/payloadcms/template-website',
          newTab: true,
        },
      },
    ],
    media: '{{SHIRTS_IMAGE}}',
  },
  layout: [
    {
      blockName: 'Content Block',
      blockType: 'content',
      backgroundColor: 'white',
      columns: [
        {
          size: 'full',
          richText: [
            {
              children: [
                {
                  text: 'Here are all of your posts...',
                },
              ],
            },
          ],
          enableLink: false,
          link: {
            reference: {
              value: '',
              relationTo: 'pages',
            },
            url: '',
            label: '',
          },
        },
      ],
    },
  ],
  meta: {
    title: 'Website ABC',
    description: 'Next.js Website with Payload CMS',
    image: '{{SHIRTS_IMAGE}}',
  },
}

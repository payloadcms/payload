import type { Page } from '../payload-types'

export const contactPage: Partial<Page> = {
  title: 'Contact Page',
  slug: 'contact',
  _status: 'published',
  meta: {
    title: 'Contact Page',
    description: 'This is the contact page',
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
            text: 'Contact Page',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This is the contact page. This hero and the content on this page is completely dynamic and ',
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

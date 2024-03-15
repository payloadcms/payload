import type { Page } from '../payload-types'

export const cartPage: Partial<Page> = {
  slug: 'cart',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    links: [],
    media: '',
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'Cart',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This cart saves to local storage so you can continue shopping later. Once you authenticate with Payload, your cart will sync to your user profile so you can continue shopping from any device. This hero and the content below the cart are completely dynamic and ',
          },
          {
            type: 'link',
            children: [
              {
                text: 'configured in the admin dashboard',
              },
            ],
            linkType: 'custom',
            url: '/admin',
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
            type: 'reference',
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              children: [
                {
                  text: 'This is a custom layout building block configurable in the CMS—this can be anything you want. Related or suggested products, a blog post, video, etc.',
                },
              ],
            },
          ],
          size: 'twoThirds',
        },
      ],
    },
    {
      blockName: 'CTA',
      blockType: 'cta',
      links: [
        {
          link: {
            type: 'reference',
            appearance: 'primary',
            label: 'Continue shopping',
            reference: {
              relationTo: 'pages',
              value: '{{PRODUCTS_PAGE_ID}}',
            },
            url: '',
          },
        },
      ],
      richText: [
        {
          type: 'h4',
          children: [
            {
              text: 'Continue shopping',
            },
          ],
        },
        {
          children: [
            {
              text: 'This is a custom layout building block ',
            },
            {
              type: 'link',
              children: [
                {
                  text: 'configured in the admin dashboard',
                },
              ],
              linkType: 'custom',
              url: '/admin',
            },
            {
              text: '.',
            },
          ],
        },
      ],
    },
  ],
  meta: {
    description:
      'Your cart will sync to your user profile so you can continue shopping from any device.',
    title: 'Cart',
  },
  title: 'Cart',
}

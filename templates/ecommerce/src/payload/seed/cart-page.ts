import type { Page } from '../payload-types'

export const cartPage: Partial<Page> = {
  title: 'Cart',
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
            text: 'This cart saves to local storage so you can continue shopping later. Once you authenticate with Payload, your cart will sync to your user profile so you can continue shopping from any device. This hero and the content below the cart are completely dynamic and configured in the CMS.',
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
          link: {
            type: 'reference',
            url: '',
            reference: {
              relationTo: 'pages',
              value: '',
            },
            label: '',
          },
          richText: [
            {
              children: [
                {
                  text: 'This is a custom layout building block configurable in the CMS—this can be anything you want. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      richText: [
        {
          children: [
            {
              text: 'Continue shopping',
            },
          ],
          type: 'h4',
        },
        {
          children: [
            {
              text: 'This is a custom layout building block ',
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
            {
              text: '.',
            },
          ],
        },
      ],
      links: [
        {
          link: {
            type: 'reference',
            url: '',
            reference: {
              relationTo: 'pages',
              value: '{{SHOP_PAGE_ID}}',
            },
            label: 'Continue shopping',
            appearance: 'primary',
          },
        },
      ],
      blockName: 'CTA',
      blockType: 'cta',
    },
  ],
  meta: {
    title: 'Cart',
    description: 'Your cart',
  },
}

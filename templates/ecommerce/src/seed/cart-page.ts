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
            text: 'This cart saves to local storage so you can continue shopping later, then when you authenticate with Payload, it syncs to your user profile so you can continue shopping from any device. This hero and the content below the cart are completely dynamic and configured in the CMS.',
          },
        ],
      },
    ],
  },
  layout: [
    {
      blockType: 'content',
      backgroundColor: 'white',
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
      ctaBackgroundColor: 'white',
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
              text: 'This is a custom layout building block configurable in the CMS.',
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

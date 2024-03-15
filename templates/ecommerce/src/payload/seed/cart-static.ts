import type { Page } from '../payload-types'

export const staticCart: Page = {
  id: '',
  slug: 'cart',
  _status: 'published',
  createdAt: '',
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
            text: 'This cart saves to local storage so you can continue shopping later. Once you authenticate with Payload, your cart will sync to your user profile so you can continue shopping from any device. ',
          },
          {
            bold: true,
            text: 'Your database does not have a cart page yet.',
          },
          {
            text: " You are currently seeing a demo page. To manage this page's content, ",
          },
          {
            type: 'link',
            children: [
              {
                text: 'log in to the admin dashboard',
              },
            ],
            linkType: 'custom',
            url: '/admin',
          },
          {
            text: ' and click "seed your database". If you have already seeded your database, ',
          },
          {
            bold: true,
            text: 'you may need to hard refresh this page to clear the cached request.',
          },
        ],
      },
    ],
  },
  layout: [
    {
      blockName: 'CTA',
      blockType: 'cta',
      links: [
        {
          link: {
            type: 'custom',
            appearance: 'primary',
            label: 'Go to dashboard',
            reference: null,
            url: '/admin',
          },
        },
      ],
      richText: [
        {
          type: 'h4',
          children: [
            {
              text: 'Create a cart page',
            },
          ],
        },
        {
          children: [
            {
              text: 'Your database is does not have a cart page yet. To seed your database with a cart page, ',
            },
            {
              type: 'link',
              children: [
                {
                  text: 'log in to the admin dashboard',
                },
              ],
              linkType: 'custom',
              url: '/admin',
            },
            {
              text: ' and click "seed your database".',
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
  updatedAt: '',
}

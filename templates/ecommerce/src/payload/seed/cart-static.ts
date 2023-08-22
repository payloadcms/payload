import type { Page } from '../payload-types'

export const staticCart: Page = {
  id: '',
  title: 'Cart',
  slug: 'cart',
  createdAt: '',
  updatedAt: '',
  _status: 'published',
  meta: {
    title: 'Cart',
    description:
      'Your cart will sync to your user profile so you can continue shopping from any device.',
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
            text: 'Your database does not have a cart page yet.',
            bold: true,
          },
          {
            text: " You are currently seeing a demo page. To manage this page's content, ",
          },
          {
            type: 'link',
            linkType: 'custom',
            url: '/admin',
            children: [
              {
                text: 'log in to the admin dashboard',
              },
            ],
          },
          {
            text: ' and click "seed your database". If you have already seeded your database, ',
          },
          {
            text: 'you may need to hard refresh this page to clear the cached request.',
            bold: true,
          },
        ],
      },
    ],
  },
  layout: [
    {
      richText: [
        {
          children: [
            {
              text: 'Create a cart page',
            },
          ],
          type: 'h4',
        },
        {
          children: [
            {
              text: 'Your database is does not have a cart page yet. To seed your database with a cart page, ',
            },
            {
              type: 'link',
              linkType: 'custom',
              url: '/admin',
              children: [
                {
                  text: 'log in to the admin dashboard',
                },
              ],
            },
            {
              text: ' and click "seed your database".',
            },
          ],
        },
      ],
      links: [
        {
          link: {
            type: 'custom',
            url: '/admin',
            label: 'Go to dashboard',
            appearance: 'primary',
            reference: null,
          },
        },
      ],
      blockName: 'CTA',
      blockType: 'cta',
    },
  ],
}

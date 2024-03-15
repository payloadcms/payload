import type { Page } from '../payload-types'

export const staticHome: Page = {
  id: '',
  slug: 'home',
  createdAt: '',
  hero: {
    type: 'lowImpact',
    media: '',
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'Payload E-commerce Template',
          },
        ],
      },
      {
        children: [
          {
            text: 'Welcome to your e-commerce store! ',
          },
          {
            bold: true,
            text: 'Your database is currently empty.',
          },
          {
            text: ' To seed your database with a few products and pages, ',
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
      {
        children: [
          {
            text: 'The code for this template is completely open-source and can be found ',
          },
          {
            type: 'link',
            children: [
              {
                text: 'here',
              },
            ],
            linkType: 'custom',
            newTab: true,
            url: 'https://github.com/payloadcms/payload/tree/main/templates/ecommerce',
          },
          {
            text: '.',
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
              text: 'Seed your database',
            },
          ],
        },
        {
          children: [
            {
              text: 'Your database is currently empty. To seed your database, ',
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
    description: 'An open-source e-commerce store built with Payload and Next.js.',
    title: 'Payload E-Commerce Template',
  },
  title: 'Home',
  updatedAt: '',
}

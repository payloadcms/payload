import type { Page } from '../payload-types'

export const staticHome: Page = {
  id: '',
  title: 'Home',
  slug: 'home',
  createdAt: '',
  updatedAt: '',
  meta: {
    title: 'Payload Website Template',
    description: 'An open-source website built with Payload and Next.js.',
  },
  hero: {
    type: 'lowImpact',
    links: null,
    richText: [
      {
        children: [
          {
            text: 'Payload Website Template',
          },
        ],
        type: 'h1',
      },
      {
        children: [
          {
            text: 'Welcome to your website! ',
          },
          {
            text: 'Your database is currently empty.',
            bold: true,
          },
          {
            text: ' To seed your database with a few pages, posts, and projects, ',
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
      {
        children: [
          {
            text: 'The code for this template is completely open-source and can be found ',
          },
          {
            type: 'link',
            linkType: 'custom',
            url: 'https://github.com/payloadcms/payload/tree/master/templates/website',
            newTab: true,
            children: [
              {
                text: 'here',
              },
            ],
          },
          {
            text: '.',
          },
        ],
      },
    ],
    media: '',
  },
  layout: [
    {
      richText: [
        {
          children: [
            {
              text: 'Seed your database',
            },
          ],
          type: 'h4',
        },
        {
          children: [
            {
              text: 'Your database is currently empty. To seed your database, ',
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

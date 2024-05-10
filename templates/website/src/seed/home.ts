// @ts-nocheck

import type { Page } from '../payload-types'

export const home: Partial<Page> = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'highImpact',
    links: [
      {
        link: {
          type: 'reference',
          appearance: 'primary',
          label: 'All posts',
          reference: {
            relationTo: 'pages',
            value: '{{POSTS_PAGE_ID}}',
          },
          url: '',
        },
      },
      {
        link: {
          type: 'reference',
          appearance: 'secondary',
          label: 'All projects',
          reference: {
            relationTo: 'pages',
            value: '{{PROJECTS_PAGE_ID}}',
          },
          url: '',
        },
      },
    ],
    media: '{{IMAGE_1}}',
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'Payload Website Template',
          },
        ],
      },
      {
        type: 'large-body',
        children: [
          {
            text: 'Welcome to your website! ',
          },
          {
            type: 'link',
            children: [
              {
                text: 'Visit the admin dashboard',
              },
            ],
            linkType: 'custom',
            url: '/admin',
          },
          {
            text: " to begin managing this site's content. The code for this template is completely open-source and can be found ",
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
            url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
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
      blockName: 'Content Block',
      blockType: 'content',
      columns: [
        {
          richText: [
            {
              type: 'h2',
              children: [
                {
                  text: 'Core features',
                },
              ],
            },
            {
              children: [
                {
                  text: '',
                },
              ],
            },
          ],
          size: 'full',
        },
        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'Admin Dashboard',
                },
              ],
            },
            {
              children: [
                {
                  text: "Manage this site's pages, posts, projects and more from the ",
                },
                {
                  type: 'link',
                  children: [
                    {
                      text: 'admin dashboard',
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
          size: 'oneThird',
        },
        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'Authentication',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Complete user ',
                },
                {
                  type: 'link',
                  children: [
                    {
                      text: 'login',
                    },
                  ],
                  linkType: 'custom',
                  url: '/login',
                },
                {
                  text: ' and ',
                },
                {
                  type: 'link',
                  children: [
                    {
                      text: 'create account',
                    },
                  ],
                  linkType: 'custom',
                  url: '/create-account',
                },
                {
                  text: ' flows with email verification and password reset.',
                },
              ],
            },
          ],
          size: 'oneThird',
        },

        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'Preview',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Using versions, drafts, and preview, editors can review and share their changes before publishing them.',
                },
              ],
            },
          ],
          size: 'oneThird',
        },
        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'Comments',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Users can comment on posts and editors can moderate comments directly from the ',
                },
                {
                  type: 'link',
                  children: [
                    {
                      text: 'admin dashboard',
                    },
                  ],
                  linkType: 'custom',
                  url: '/admin/collections/comments',
                },
                {
                  text: '.',
                },
              ],
            },
          ],
          size: 'oneThird',
        },
        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'User Accounts',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Users can ',
                },
                {
                  type: 'link',
                  children: [
                    {
                      text: 'manage their account',
                    },
                  ],
                  linkType: 'custom',
                  url: '/account',
                },
                {
                  text: ', view their comment history, and more without leaving the site.',
                },
              ],
            },
          ],
          size: 'oneThird',
        },
        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'Premium Content',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Easily restrict access to premium content to only authenticated members of your site.',
                },
              ],
            },
          ],
          size: 'oneThird',
        },
        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'Page Builder',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Custom page builder allows you to create unique page, post, and project layouts for any type of content.',
                },
              ],
            },
          ],
          size: 'oneThird',
        },
        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'SEO',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Editors have complete control over SEO data and site content directly from the ',
                },
                {
                  type: 'link',
                  children: [
                    {
                      text: 'admin dashboard',
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
          size: 'oneThird',
        },
        {
          enableLink: false,
          link: {
            label: '',
            reference: null,
            url: '',
          },
          richText: [
            {
              type: 'h3',
              children: [
                {
                  text: 'Dark Mode',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Users will experience this site in their preferred color scheme and each block can be inverted.',
                },
              ],
            },
          ],
          size: 'oneThird',
        },
      ],
    },
    {
      blockName: 'Media Block',
      blockType: 'mediaBlock',
      media: '{{IMAGE_2}}',
      position: 'default',
    },
    {
      blockName: 'Archive Block',
      blockType: 'archive',
      categories: [],
      introContent: [
        {
          type: 'h4',
          children: [
            {
              text: 'Recent posts',
            },
          ],
        },
        {
          type: 'p',
          children: [
            {
              text: 'The posts below are displayed in an "Archive" layout building block which is an extremely powerful way to display documents on a page. It can be auto-populated by collection or by category, or posts can be individually selected. Pagination controls will automatically appear if the number of results exceeds the number of items per page.',
            },
          ],
        },
      ],
      populateBy: 'collection',
      relationTo: 'posts',
    },
    {
      blockName: 'CTA',
      blockType: 'cta',
      links: [
        {
          link: {
            type: 'reference',
            appearance: 'primary',
            label: 'All posts',
            reference: {
              relationTo: 'pages',
              value: '{{POSTS_PAGE_ID}}',
            },
            url: '',
          },
        },
        {
          link: {
            type: 'reference',
            appearance: 'secondary',
            label: 'All projects',
            reference: {
              relationTo: 'pages',
              value: '{{PROJECTS_PAGE_ID}}',
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
              text: 'This is a call to action',
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
    description: 'An open-source website built with Payload and Next.js.',
    image: '{{IMAGE_1}}',
    title: 'Payload Website Template',
  },
  title: 'Home',
}

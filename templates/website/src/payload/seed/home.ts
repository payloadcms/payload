import type { Page } from '../payload-types'

export const home: Partial<Page> = {
  title: 'Home',
  slug: 'home',
  _status: 'published',
  meta: {
    title: 'Payload Website Template',
    description: 'An open-source website built with Payload and Next.js.',
    image: '{{IMAGE_1}}',
  },
  hero: {
    type: 'highImpact',
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
            type: 'link',
            linkType: 'custom',
            url: '/admin',
            children: [
              {
                text: 'Visit the admin dashboard',
              },
            ],
          },
          {
            text: " to begin managing this site's content. The code for this template is completely open-source and can be found ",
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
        type: 'large-body',
      },
    ],
    links: [
      {
        link: {
          type: 'reference',
          appearance: 'primary',
          reference: {
            relationTo: 'pages',
            value: '{{POSTS_PAGE_ID}}',
          },
          label: 'All posts',
          url: '',
        },
      },
      {
        link: {
          type: 'reference',
          appearance: 'secondary',
          reference: {
            relationTo: 'pages',
            value: '{{PROJECTS_PAGE_ID}}',
          },
          label: 'All projects',
          url: '',
        },
      },
    ],
    media: '{{IMAGE_1}}',
  },
  layout: [
    {
      blockName: 'Content Block',
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: [
            {
              children: [
                {
                  text: 'Core features',
                },
              ],
              type: 'h2',
            },
            {
              children: [
                {
                  text: '',
                },
              ],
            },
          ],
        },
        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'Admin Dashboard',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: "Manage this site's pages, posts, projects and more from the ",
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: '/admin',
                  children: [
                    {
                      text: 'admin dashboard',
                    },
                  ],
                },
                {
                  text: '.',
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
        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'Authentication',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Complete user ',
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: '/login',
                  children: [
                    {
                      text: 'login',
                    },
                  ],
                },
                {
                  text: ' and ',
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: '/create-account',
                  children: [
                    {
                      text: 'create account',
                    },
                  ],
                },
                {
                  text: ' flows with email verification and password reset.',
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

        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'Preview',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Using versions, drafts, and preview, editors can review and share their changes before publishing them.',
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
        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'Comments',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Users can comment on posts and editors can moderate comments directly from the ',
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: '/admin/collections/comments',
                  children: [
                    {
                      text: 'admin dashboard',
                    },
                  ],
                },
                {
                  text: '.',
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
        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'User Accounts',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Users can ',
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: '/account',
                  children: [
                    {
                      text: 'manage their account',
                    },
                  ],
                },
                {
                  text: ', view their comment history, and more without leaving the site.',
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
        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'Premium Content',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Easily restrict access to premium content to only authenticated members of your site.',
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
        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'Page Builder',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Custom page builder allows you to create unique page, post, and project layouts for any type of content.',
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
        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'SEO',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Editors have complete control over SEO data and site content directly from the ',
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: '/admin',
                  children: [
                    {
                      text: 'admin dashboard',
                    },
                  ],
                },
                {
                  text: '.',
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
        {
          size: 'oneThird',
          richText: [
            {
              children: [
                {
                  text: 'Dark Mode',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Users will experience this site in their preferred color scheme and each block can be inverted.',
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
    {
      blockType: 'mediaBlock',
      blockName: 'Media Block',
      position: 'default',
      media: '{{IMAGE_2}}',
    },
    {
      blockName: 'Archive Block',
      blockType: 'archive',
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
      categories: [],
    },
    {
      blockName: 'Archive Block',
      blockType: 'archive',
      introContent: [
        {
          type: 'h4',
          children: [
            {
              text: 'Recent projects',
            },
          ],
        },
        {
          type: 'p',
          children: [
            {
              text: 'The projects below are displayed in an "Archive" layout building block which is an extremely powerful way to display documents on a page. It can be auto-populated by collection or by category, or projects can be individually selected. Pagination controls will automatically appear if the number of results exceeds the number of items per page.',
            },
          ],
        },
      ],
      populateBy: 'collection',
      relationTo: 'projects',
      categories: [],
    },
    {
      blockType: 'cta',
      blockName: 'CTA',
      richText: [
        {
          children: [
            {
              text: 'This is a call to action',
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
            label: 'All posts',
            appearance: 'primary',
            reference: {
              value: '{{POSTS_PAGE_ID}}',
              relationTo: 'pages',
            },
          },
        },
        {
          link: {
            type: 'reference',
            url: '',
            label: 'All projects',
            appearance: 'secondary',
            reference: {
              value: '{{PROJECTS_PAGE_ID}}',
              relationTo: 'pages',
            },
          },
        },
      ],
    },
  ],
}

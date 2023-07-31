import type { Page } from '../payload-types'

export const home: Partial<Page> = {
  title: 'Home',
  slug: 'home',
  _status: 'published',
  meta: {
    title: 'Payload Website Template',
    description: 'An open-source website built with Payload and Next.js.',
    image: '{{POST1_IMAGE}}',
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
            value: '{{PROJECTS_PAGE_ID}}',
          },
          label: 'View portfolio',
          url: '',
        },
      },
      {
        link: {
          type: 'reference',
          appearance: 'secondary',
          reference: {
            relationTo: 'pages',
            value: '{{POSTS_PAGE_ID}}',
          },
          label: 'Read blog',
          url: '',
        },
      },
    ],
    media: '{{POST1_IMAGE}}',
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
                  text: "Manage this site's pages, projects, posts and more from the ",
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
                  text: 'Page builder',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Custom page builder allows you to create unique page and project layouts for any type of content.',
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
                  text: 'Blog',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Create and manage blog posts that have completely custom layouts and content.',
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
                  text: 'Portfolio',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Showcase your work with projects that have completely custom layouts and content.',
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
                  text: 'Draft Preview',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Preview changes to pages, projects, or posts directly on your site before they go live.',
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
                  text: 'Form Builder',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Easily create and manage forms that send email notifications and are stored in your database.',
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
                  text: 'Dark mode',
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
      media: '{{POST2_IMAGE}}',
    },
    {
      blockType: 'cta',
      blockName: 'CTA',
      richText: [
        {
          children: [
            {
              text: 'View portfolio',
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
            label: 'View portfolio',
            appearance: 'primary',
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

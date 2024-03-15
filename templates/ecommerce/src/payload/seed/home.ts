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
          label: 'Shop now',
          reference: {
            relationTo: 'pages',
            value: '{{PRODUCTS_PAGE_ID}}',
          },
          url: '',
        },
      },
      {
        link: {
          type: 'custom',
          appearance: 'secondary',
          label: 'View on GitHub',
          newTab: true,
          reference: null,
          url: 'https://github.com/payloadcms/payload/tree/main/templates/ecommerce',
        },
      },
    ],
    media: '{{PRODUCT1_IMAGE}}',
    richText: [
      {
        type: 'h1',
        children: [
          {
            text: 'Payload E-Commerce Store',
          },
        ],
      },
      {
        type: 'large-body',
        children: [
          {
            text: 'Welcome to your store! ',
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
      blockName: 'Content Block',
      blockType: 'content',
      columns: [
        {
          richText: [
            {
              type: 'h2',
              children: [
                {
                  text: 'Core Features',
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
                  text: "Manage this site's users, pages, products, and more from the ",
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
                  text: 'User ',
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
                  text: ' flows are complete with email verification and password reset.',
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
                  text: 'Customer Accounts',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Customers can ',
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
                  text: ', ',
                },
                {
                  type: 'link',
                  children: [
                    {
                      text: 'view their order history',
                    },
                  ],
                  linkType: 'custom',
                  url: '/orders',
                },
                {
                  text: ', and more without leaving the site.',
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
                  text: 'Paywall',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Easily gate digital content behind a paywall or require users to be logged in to access it.',
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
                  text: 'Shopping Cart',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Shopping carts persist between sessions, can be saved for later, and are accessible from any device.',
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
                  text: 'Checkout',
                },
              ],
            },
            {
              children: [
                {
                  text: 'Secure in-app checkout powered by Stripe means your customers never have to leave your site.',
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
                  text: 'Custom page builder allows you to create unique page and product layouts for any type of content.',
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
                  text: 'Users will experience this site in their preferred color scheme, and each block can be inverted.',
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
      media: '{{PRODUCT2_IMAGE}}',
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
              text: 'Recent Products',
            },
          ],
        },
        {
          type: 'p',
          children: [
            {
              text: 'The products below are displayed in an "Archive" layout building block which is an extremely powerful way to display documents on a page. It can be auto-populated by collection or by category, or products can be individually selected. Pagination controls will automatically appear if the number of results exceeds the number of items per page.',
            },
          ],
        },
      ],
      populateBy: 'collection',
      relationTo: 'products',
    },
    {
      blockName: 'CTA',
      blockType: 'cta',
      links: [
        {
          link: {
            type: 'reference',
            appearance: 'primary',
            label: 'Shop now',
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
              text: 'Shop now',
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
    description: 'An open-source e-commerce store built with Payload and Next.js.',
    image: '{{PRODUCT1_IMAGE}}',
    title: 'Payload E-Commerce Template',
  },
  title: 'Home',
}

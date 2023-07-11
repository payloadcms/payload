import type { Page } from '../payload-types'

export const home: Partial<Page> = {
  title: 'Home',
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'highImpact',
    richText: [
      {
        children: [
          {
            text: 'Payload E-Commerce Store',
          },
        ],
        type: 'h1',
      },
      {
        children: [
          {
            text: 'Welcome to your store! Visit the ',
          },
          {
            type: 'link',
            linkType: 'custom',
            url: '/admin',
            children: [
              {
                text: 'dashboard',
              },
            ],
          },
          {
            text: " to begin managing your site's content. The code for this template is completely open-source and can be found ",
          },
          {
            type: 'link',
            linkType: 'custom',
            url: 'https://github.com/payloadcms/payload/tree/master/templates/ecommerce',
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
            value: '{{SHOP_PAGE_ID}}',
          },
          label: 'Shop now',
          url: '',
        },
      },
      {
        link: {
          type: 'custom',
          appearance: 'secondary',
          reference: null,
          label: 'View on GitHub',
          url: 'https://github.com/payloadcms/payload/tree/master/templates/ecommerce',
          newTab: true,
        },
      },
    ],
    media: '{{PRODUCT1_IMAGE}}',
  },
  layout: [
    {
      blockName: 'Content Block',
      blockType: 'content',
      backgroundColor: 'white',
      columns: [
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
                  text: 'Customers can create an account and login to view their order history and more.',
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
                  text: 'Shopping cart',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Shopping carts persist between sessions and can be accessed from any device.',
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
                  text: 'Checkout',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Secure in-app checkout powered by Stripe so your customers stay on your site.',
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
                  text: 'Custom page builder allows you to create unique page or product layouts.',
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
                  text: 'Editors have complete control over SEO data directly from the CMS.',
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
                  text: 'End-to-end',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  type: 'link',
                  linkType: 'custom',
                  url: 'https://github.com/payloadcms/payload/tree/master/templates/ecommerce',
                  newTab: true,
                  children: [
                    {
                      text: 'Payload',
                    },
                  ],
                },
                {
                  text: ' and ',
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: 'https://nextjs.org',
                  newTab: true,
                  children: [
                    {
                      text: 'Next.js',
                    },
                  ],
                },
                {
                  text: ' are production-ready out of the box.',
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
      mediaBlockBackgroundColor: 'white',
      position: 'default',
      media: '{{PRODUCT2_IMAGE}}',
      blockName: 'Media Block',
      blockType: 'mediaBlock',
    },
    {
      ctaBackgroundColor: 'white',
      richText: [
        {
          children: [
            {
              text: 'Shop now',
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
            label: 'Shop now',
            appearance: 'primary',
            reference: {
              value: '{{SHOP_PAGE_ID}}',
              relationTo: 'pages',
            },
          },
        },
      ],
      blockName: 'CTA',
      blockType: 'cta',
    },
  ],
  meta: {
    title: 'Store ABC',
    description: 'E-Commerce Store with Payload + Next.js',
    image: '{{PRODUCT1_IMAGE}}',
  },
}

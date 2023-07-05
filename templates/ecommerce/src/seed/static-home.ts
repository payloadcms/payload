import type { Page } from '../payload-types'

export const staticHome: Partial<Page> = {
  slug: 'home',
  layout: [
    {
      blockName: 'Content Block',
      blockType: 'content',
      backgroundColor: 'white',
      columns: [
        {
          size: 'full',
          richText: [
            {
              children: [
                {
                  text: 'Payload E-commerce Store',
                },
              ],
              type: 'h1',
            },
            {
              children: [
                {
                  text: 'Your database is currently empty. To seed your database with a few products and pages, ',
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: '/admin',
                  children: [
                    {
                      text: 'log in',
                    },
                  ],
                },
                {
                  text: ' and click "seed your database". The code for this template is completely open-source and can be found ',
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
  ],
}

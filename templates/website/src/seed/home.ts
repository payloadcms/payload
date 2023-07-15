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
            text: 'Next.js Website with Payload CMS',
          },
        ],
        type: 'h1',
      },
      {
        children: [
          {
            text: 'The code for this website is completely open-source and can be found ',
          },
          {
            type: 'link',
            linkType: 'custom',
            url: 'https://github.com/payloadcms/template-website-nextjs',
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
          type: 'custom',
          appearance: 'secondary',
          reference: null,
          label: 'View on GitHub',
          url: 'https://github.com/payloadcms/template-website',
          newTab: true,
        },
      },
    ],
    media: '{{SHIRTS_IMAGE}}',
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
                  text: 'Page builder',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Custom page builder allows you to create any page or product layout imaginable.',
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
                  text: 'CMS',
                },
              ],
              type: 'h3',
            },
            {
              children: [
                {
                  text: 'Instant setup with ',
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: 'https://github.com/payloadcms/template-website-nextjs',
                  newTab: true,
                  children: [
                    {
                      text: 'Payload CMS',
                    },
                  ],
                },
                {
                  text: ' tailored specifically for this front-end.',
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
      media: '{{COURSE_IMAGE}}',
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
      links: [],
      blockName: 'CTA',
      blockType: 'cta',
    },
  ],
  meta: {
    title: 'Website ABC',
    description: 'Next.js Website with Payload CMS',
    image: '{{SHIRTS_IMAGE}}',
  },
}

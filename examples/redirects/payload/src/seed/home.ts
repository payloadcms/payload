import path from 'path'
import type { Page } from '../payload-types'

// eslint-disable-next-line
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
})

export const home: Partial<Page> = {
  title: 'Home Page',
  slug: 'home',
  richText: [
    {
      children: [
        {
          text: 'This is a ',
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'https://nextjs.org/',
          children: [
            {
              text: 'Next.js',
            },
          ],
        },
        {
          text: " app made explicitly for Payload's ",
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'https://github.com/payloadcms/payload/tree/main/examples/redirects/cms',
          children: [
            {
              text: 'Redirects Example',
            },
          ],
        },
        {
          text: '. This example demonstrates how to implement http redirects into Payload using the official ',
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'https://github.com/payloadcms/plugin-redirects',
          children: [
            {
              text: 'Redirects Plugin',
            },
          ],
        },
        {
          text: '.',
        },
      ],
    },
    {
      children: [
        {
          text: 'Paste ',
        },
        {
          text: `${process.env.PAYLOAD_PUBLIC_SITE_URL}/redirect-to-internal`,
          bold: true,
        },
        {
          text: ' into your browser to be redirected to ',
        },
        {
          type: 'link',
          linkType: 'internal',
          doc: {
            value: '{{REDIRECT_PAGE_ID}}',
            relationTo: 'pages',
          },
          children: [
            {
              text: 'this page',
            },
          ],
        },
        {
          text: ', or paste ',
        },
        {
          text: `${process.env.PAYLOAD_PUBLIC_SITE_URL}/redirect-to-external`,
          bold: true,
        },
        {
          text: ' into your browser to be redirected to ',
        },
        {
          text: 'payloadcms.com',
          bold: true,
        },
        {
          text: '.',
        },
      ],
    },
  ],
  _status: 'published',
}

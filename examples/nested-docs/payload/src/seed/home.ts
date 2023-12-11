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
          url: 'https://nextjs.org',
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
          url: 'https://github.com/payloadcms/payload/tree/main/examples/nested-docs/payload',
          children: [
            {
              text: 'Nested Docs Example',
            },
          ],
        },
        {
          text: '. This example demonstrates how to implement nested docs into Payload using the official ',
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'https://github.com/payloadcms/payload/tree/main/packages/plugin-nested-docs',
          children: [
            {
              text: 'Nested Docs Plugin',
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
          text: 'Navigate to ',
        },
        {
          type: 'link',
          linkType: 'reference',
          doc: {
            value: '{{PARENT_PAGE_ID}}',
            relationTo: 'pages',
          },
          children: [
            {
              text: 'the parent page',
            },
          ],
        },
        {
          text: ', ',
        },
        {
          type: 'link',
          linkType: 'reference',
          doc: {
            value: '{{CHILD_PAGE_ID}}',
            relationTo: 'pages',
          },
          children: [
            {
              text: 'the child page',
            },
          ],
        },
        {
          text: ', or ',
        },
        {
          type: 'link',
          linkType: 'reference',
          doc: {
            value: '{{GRANDCHILD_PAGE_ID}}',
            relationTo: 'pages',
          },
          children: [
            {
              text: 'the grandchild page',
            },
          ],
        },
        {
          text: ' to see how the nested docs are rendered.',
        },
      ],
    },
  ],
}

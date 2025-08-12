import type { Page } from '@payload-types'

// Used for pre-seeded content so that the homepage is not empty
// @ts-expect-error: Page type is not fully compatible with the provided object structure
export const home: Page = {
  slug: 'home',
  _status: 'published',
  richText: [
    {
      children: [
        { text: 'This is a ' },
        { type: 'link', children: [{ text: '' }], newTab: true, url: 'https://nextjs.org/' },
        { text: '' },
        {
          type: 'link',
          children: [{ text: 'Next.js' }],
          linkType: 'custom',
          newTab: true,
          url: 'https://nextjs.org/',
        },
        { text: " app made explicitly for Payload's " },
        {
          type: 'link',
          children: [{ text: 'Draft Preview Example' }],
          linkType: 'custom',
          newTab: true,
          url: 'https://github.com/payloadcms/payload/tree/main/examples/draft-preview/payload',
        },
        { text: '. This example demonstrates how to implement draft preview into Payload using ' },
        {
          type: 'link',
          children: [{ text: 'Drafts' }],
          newTab: true,
          url: 'https://payloadcms.com/docs/versions/drafts#drafts',
        },
        { text: '.' },
      ],
    },
    { children: [{ text: '' }] },
    {
      children: [
        {
          type: 'link',
          children: [{ text: 'Log in to the admin panel' }],
          linkType: 'custom',
          newTab: true,
          url: 'http://localhost:3000/admin',
        },
        { text: ' and refresh this page to see the ' },
        {
          type: 'link',
          children: [{ text: 'Payload Admin Bar' }],
          linkType: 'custom',
          newTab: true,
          url: 'https://github.com/payloadcms/payload/tree/main/packages/admin-bar',
        },
        {
          text: ' appear at the top of this site. This will allow you to seamlessly navigate between the two apps. Then, navigate to the ',
        },
        {
          type: 'link',
          children: [{ text: 'example page' }],
          linkType: 'custom',
          url: 'http://localhost:3000/example-page',
        },
        { text: ' to see how we control access to draft content. ' },
      ],
    },
  ],
  title: 'Home Page',
}

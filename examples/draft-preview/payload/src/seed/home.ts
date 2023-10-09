import type { Page } from '../payload-types'

export const home: Partial<Page> = {
  title: 'Home Page',
  slug: 'home',
  _status: 'published',
  richText: [
    {
      children: [
        { text: 'This is a ' },
        { type: 'link', newTab: true, url: 'https://nextjs.org/', children: [{ text: '' }] },
        { text: '' },
        {
          type: 'link',
          linkType: 'custom',
          url: 'https://nextjs.org/',
          newTab: true,
          children: [{ text: 'Next.js' }],
        },
        { text: " app made explicitly for Payload's " },
        {
          type: 'link',
          newTab: true,
          url: 'https://github.com/payloadcms/payload/tree/main/examples/redirects',
          children: [{ text: '' }],
        },
        { text: '' },
        {
          type: 'link',
          linkType: 'custom',
          newTab: true,
          url: 'https://github.com/payloadcms/payload/tree/main/examples/draft-preview/payload',
          children: [{ text: 'Draft Preview Example' }],
        },
        { text: '. This example demonstrates how to implement draft preview into Payload using ' },
        {
          type: 'link',
          newTab: true,
          url: 'https://payloadcms.com/docs/versions/drafts#drafts',
          children: [{ text: 'Drafts' }],
        },
        { text: '.' },
      ],
    },
    { children: [{ text: '' }] },
    {
      children: [
        {
          type: 'link',
          linkType: 'custom',
          url: 'http://localhost:3000/admin',
          newTab: true,
          children: [{ text: 'Log in to the admin panel' }],
        },
        { text: ' and refresh this page to see the ' },
        {
          type: 'link',
          linkType: 'custom',
          newTab: true,
          url: 'https://github.com/payloadcms/payload-admin-bar',
          children: [{ text: 'Payload Admin Bar' }],
        },
        {
          text: ' appear at the top of this site. This will allow you to seamlessly navigate between the two apps. Then, navigate to the ',
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'http://localhost:3001/example-page',
          children: [{ text: 'example page' }],
        },
        { text: ' to see how we control access to draft content. ' },
      ],
    },
  ],
}

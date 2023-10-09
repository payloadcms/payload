import type { Page } from '../payload-types'

export const home: Partial<Page> = {
  title: 'Home',
  slug: 'home',
  richText: [
    {
      type: 'h1',
      children: [
        {
          text: 'Payload Live Preview Example',
        },
      ],
    },
    {
      children: [
        { text: 'This is a ' },
        {
          type: 'link',
          linkType: 'custom',
          url: 'https://nextjs.org',
          newTab: true,
          children: [{ text: 'Next.js' }],
        },
        { text: " app made explicitly for Payload's " },
        {
          type: 'link',
          linkType: 'custom',
          newTab: true,
          url: 'https://github.com/payloadcms/payload/tree/master/examples/live-preview/payload',
          children: [{ text: 'Live Preview Example' }],
        },
        { text: '. With ' },
        {
          type: 'link',
          newTab: true,
          url: 'https://payloadcms.com/docs/live-preview',
          children: [{ text: 'Live Preview' }],
        },
        {
          text: ' you can edit this page in the admin panel and see the changes reflected here in real time.',
        },
      ],
    },
  ],
}

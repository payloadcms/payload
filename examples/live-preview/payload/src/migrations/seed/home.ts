import type { Page } from '../../payload-types'

export const home: Partial<Page> = {
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
          children: [{ text: 'Next.js' }],
          linkType: 'custom',
          newTab: true,
          url: 'https://nextjs.org',
        },
        { text: " app made explicitly for Payload's " },
        {
          type: 'link',
          children: [{ text: 'Live Preview Example' }],
          linkType: 'custom',
          newTab: true,
          url: 'https://github.com/payloadcms/payload/tree/master/examples/live-preview/payload',
        },
        { text: '. With ' },
        {
          type: 'link',
          children: [{ text: 'Live Preview' }],
          newTab: true,
          url: 'https://payloadcms.com/docs/live-preview',
        },
        {
          text: ' you can edit this page in the admin panel and see the changes reflected here in real time.',
        },
      ],
    },
  ],
  title: 'Home',
}

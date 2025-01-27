import type { Page } from '../payload-types'

export const examplePage: Partial<Page> = {
  title: 'Example Page (Published)',
  slug: 'example-page',
  _status: 'published',
  richText: [
    {
      children: [
        {
          text: 'This is an example page with two versions, draft and published. You are currently seeing ',
        },
        {
          text: 'published',
          bold: true,
        },
        {
          text: ' content because you are not in preview mode. ',
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'http://localhost:3000/admin',
          newTab: true,
          children: [{ text: 'Log in to the admin panel' }],
        },
        {
          text: ' and click "preview" to return to this page and view the latest draft content in Next.js preview mode. To make additional changes to the draft, click "save draft" before returning to the preview.',
        },
      ],
    },
  ],
}

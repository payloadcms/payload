import type { Page } from '@payload-types'

export const examplePageDraft: Partial<Page> = {
  richText: [
    {
      children: [
        {
          text: 'This page is an example page with two versions, draft and published. You are currently seeing ',
        },
        {
          bold: true,
          text: 'draft',
        },
        {
          text: ' content because you in preview mode. ',
        },
        {
          type: 'link',
          children: [{ text: 'Log out' }],
          linkType: 'custom',
          newTab: true,
          url: 'http://localhost:3000/admin/logout',
        },
        {
          text: ' or click "exit preview mode" from the Payload Admin Bar to see the latest published content. To make additional changes to the draft, click "save draft" before returning to the preview.',
        },
      ],
    },
  ],
  title: 'Example Page (Draft)',
}

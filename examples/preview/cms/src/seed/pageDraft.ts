import type { Page } from '../payload-types'

export const examplePageDraft: Partial<Page> = {
  richText: [
    {
      children: [
        {
          text: 'This page is an example page with two versions, draft and published. You are currently seeing ',
        },
        {
          text: 'draft',
          bold: true,
        },
        {
          text: ' content because you in preview mode. ',
        },
        {
          type: 'link',
          linkType: 'custom',
          url: 'http://localhost:3000/admin/logout',
          newTab: true,
          children: [{ text: 'Log out' }],
        },
        {
          text: ' or exit Next.js preview mode to see the latest published content.',
        },
      ],
    },
  ],
}

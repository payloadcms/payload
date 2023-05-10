import type { Page } from '../payload-types'

export const redirectPage: Partial<Page> = {
  title: 'Redirect Page',
  slug: 'redirected',
  richText: [
    {
      children: [
        {
          text: 'You have been successfully redirected to this page if you navigated from ',
        },
        {
          text: 'http://localhost:3000/redirect-to-internal',
          bold: true,
        },
        {
          text: '.',
        },
      ],
    },
    {
      children: [
        {
          text: '',
        },
      ],
    },
  ],
  _status: 'published',
}

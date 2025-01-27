import path from 'path'
import type { Page } from '../payload-types'

// eslint-disable-next-line
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
})

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
          text: `${process.env.PAYLOAD_PUBLIC_SITE_URL}/redirect-to-internal`,
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

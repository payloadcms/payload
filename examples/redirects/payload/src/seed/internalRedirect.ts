import path from 'path'
import type { Redirect } from '../payload-types'

// eslint-disable-next-line
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
})

export const internalRedirect: Partial<Redirect> = {
  from: `${process.env.PAYLOAD_PUBLIC_SITE_URL}/redirect-to-internal`,
  to: {
    type: 'reference',
    reference: {
      value: '{{REDIRECT_PAGE_ID}}',
      relationTo: 'pages',
    },
    url: '',
  },
}

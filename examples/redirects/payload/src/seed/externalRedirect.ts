import path from 'path'
import type { Redirect } from '../payload-types'

// eslint-disable-next-line
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
})

export const externalRedirect: Partial<Redirect> = {
  from: `${process.env.PAYLOAD_PUBLIC_SITE_URL}/redirect-to-external`,
  to: {
    type: 'custom',
    url: 'https://www.payloadcms.com',
    reference: null,
  },
  createdAt: '2023-02-01T20:35:34.257Z',
  updatedAt: '2023-02-01T20:35:34.257Z',
}

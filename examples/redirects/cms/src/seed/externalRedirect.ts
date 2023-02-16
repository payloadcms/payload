import type { Redirect } from '../payload-types'

export const externalRedirect: Partial<Redirect> = {
  from: 'http://localhost:3000/redirect-to-external',
  to: {
    type: 'custom',
    url: 'https://www.payloadcms.com',
    reference: null,
  },
  createdAt: '2023-02-01T20:35:34.257Z',
  updatedAt: '2023-02-01T20:35:34.257Z',
}

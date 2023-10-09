import type { Redirect } from '../payload-types'

export const internalRedirect: Partial<Redirect> = {
  from: 'http://localhost:3000/redirect-to-internal',
  to: {
    type: 'reference',
    reference: {
      value: '{{REDIRECT_PAGE_ID}}',
      relationTo: 'pages',
    },
    url: '',
  },
}

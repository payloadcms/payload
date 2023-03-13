import type { Payload } from 'payload'

import { externalRedirect } from './externalRedirect'
import { home } from './home'
import { internalRedirect } from './internalRedirect'
import { redirectPage } from './redirectPage'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  })

  const redirectPageJSON = JSON.parse(JSON.stringify(redirectPage))

  const { id: redirectPageID } = await payload.create({
    collection: 'pages',
    data: redirectPageJSON,
  })

  const internalRedirectJSON = JSON.parse(
    JSON.stringify(internalRedirect).replace(/{{REDIRECT_PAGE_ID}}/g, redirectPageID),
  )

  await payload.create({
    collection: 'redirects',
    data: internalRedirectJSON,
  })

  const externalRedirectJSON = JSON.parse(JSON.stringify(externalRedirect))

  await payload.create({
    collection: 'redirects',
    data: externalRedirectJSON,
  })

  const homepageJSON = JSON.parse(
    JSON.stringify(home).replace(/{{REDIRECT_PAGE_ID}}/g, redirectPageID),
  )

  await payload.create({
    collection: 'pages',
    data: homepageJSON,
  })

  await payload.updateGlobal({
    slug: 'main-menu',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            url: '',
            reference: {
              relationTo: 'pages',
              value: redirectPageID,
            },
            label: 'Redirect Page',
          },
        },
      ],
    },
  })
}

import type { Payload } from 'payload'

import { home } from './home'
import { examplePage } from './page'
import { examplePageDraft } from './pageDraft'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
    },
  })

  const { id: examplePageID } = await payload.create({
    collection: 'pages',
    data: examplePage as any, // eslint-disable-line
  })

  await payload.update({
    id: examplePageID,
    collection: 'pages',
    data: examplePageDraft as any, // eslint-disable-line
    draft: true,
  })

  const homepageJSON = JSON.parse(JSON.stringify(home).replace('{{DRAFT_PAGE_ID}}', examplePageID))

  const { id: homePageID } = await payload.create({
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
            label: 'Home',
            reference: {
              relationTo: 'pages',
              value: homePageID,
            },
            url: '',
          },
        },
        {
          link: {
            type: 'reference',
            label: 'Example Page',
            reference: {
              relationTo: 'pages',
              value: examplePageID,
            },
            url: '',
          },
        },
        {
          link: {
            type: 'custom',
            label: 'Dashboard',
            reference: undefined,
            url: 'http://localhost:3000/admin',
          },
        },
      ],
    },
  })
}

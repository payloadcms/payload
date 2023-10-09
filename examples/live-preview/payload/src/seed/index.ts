import type { Payload } from 'payload'

import { home } from './home'
import { examplePage } from './page'

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

  const homepageJSON = JSON.parse(JSON.stringify(home))

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
            reference: {
              relationTo: 'pages',
              value: homePageID,
            },
            label: 'Home',
            url: '',
          },
        },
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: examplePageID,
            },
            label: 'Example Page',
            url: '',
          },
        },
        {
          link: {
            type: 'custom',
            reference: null,
            label: 'Dashboard',
            url: 'http://localhost:3000/admin',
          },
        },
      ],
    },
  })
}

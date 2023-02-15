import type { Payload } from 'payload'
import { examplePage } from './page'
import { examplePageDraft } from './pageDraft'
import { home } from './home'

export const seed = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  })

  const { id: examplePageID } = await payload.create({
    collection: 'pages',
    data: examplePage as any, // eslint-disable-line
  })

  await payload.update({
    collection: 'pages',
    id: examplePageID,
    draft: true,
    data: examplePageDraft as any, // eslint-disable-line
  })

  const homepageJSON = JSON.parse(JSON.stringify(home).replace('{{DRAFT_PAGE_ID}}', examplePageID))

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
            type: 'custom',
            reference: null,
            label: 'Dashboard',
            url: 'http://localhost:8000/admin',
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
      ],
    },
  })
}

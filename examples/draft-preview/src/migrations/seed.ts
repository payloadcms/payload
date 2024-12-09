import type { MigrateUpArgs } from '@payloadcms/db-mongodb'

import { home } from '../seed/home'
import { examplePage } from '../seed/page'
import { examplePageDraft } from '../seed/pageDraft'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.create({
    collection: 'users',
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
    },
  })

  const { id: examplePageID } = await payload.create({
    collection: 'pages',
    context: {
      skipRevalidate: true,
    },
    data: examplePage as any, // eslint-disable-line
  })

  await payload.update({
    id: examplePageID,
    collection: 'pages',
    context: {
      skipRevalidate: true,
    },
    data: examplePageDraft as any, // eslint-disable-line
    draft: true,
  })

  const homepageJSON = JSON.parse(JSON.stringify(home).replace('{{DRAFT_PAGE_ID}}', examplePageID))

  const { id: homePageID } = await payload.create({
    collection: 'pages',
    context: {
      skipRevalidate: true,
    },
    data: homepageJSON,
  })

  await payload.updateGlobal({
    slug: 'main-menu',
    context: {
      skipRevalidate: true,
    },
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

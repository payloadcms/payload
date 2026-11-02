import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { foldersSlug, pagesSlug } from './shared.js'

export async function seed(payload: Payload) {
  await payload.create({ collection: 'users', data: devUser, overrideAccess: true })
  const folder = await payload.create({ collection: foldersSlug, data: { title: 'Editorial' } })
  const about = await payload.create({
    collection: pagesSlug,
    data: { title: 'About us', slug: 'about', _status: 'published', '_h_page-folders': folder.id },
  })
  const team = await payload.create({
    collection: pagesSlug,
    data: {
      title: 'Our team',
      slug: 'team',
      parent: about.id,
      _status: 'published',
      '_h_page-folders': folder.id,
    },
  })

  await payload.create({
    collection: pagesSlug,
    data: { title: 'Careers', slug: 'careers', parent: team.id, _status: 'draft' },
  })
  await payload.create({
    collection: pagesSlug,
    data: { title: 'Contact', slug: 'contact', _status: 'published' },
  })

  for (let i = 1; i <= 12; i++) {
    await payload.create({
      collection: pagesSlug,
      data: {
        title: `Department ${String(i).padStart(2, '0')}`,
        parent: about.id,
        _status: 'published',
      },
    })
  }
}

import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { articlesSlug, foldersSlug, pagesSlug } from './shared.js'

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

  const campaigns = await payload.create({
    collection: foldersSlug,
    data: { title: 'Campaigns', '_h_page-folders': folder.id },
  })
  await payload.create({ collection: foldersSlug, data: { title: 'Empty folder' } })
  await payload.create({
    collection: articlesSlug,
    data: { title: 'Campaign announcement', '_h_page-folders': campaigns.id },
  })

  const titles = [
    'A guide to accessible content',
    'Behind the scenes of our spring campaign',
    'Building stronger community partnerships',
    'Choosing the right training programme',
    'Designing services around real people',
    'Five ways to improve your team newsletter',
    'How our membership programme works',
    'Making public information easier to find',
    'Planning a successful community event',
    'Small changes that make a big difference',
    'The people shaping our next chapter',
    'Working together for a better experience',
  ]
  for (const title of titles) {
    await payload.create({
      collection: articlesSlug,
      data: { title, '_h_page-folders': folder.id },
    })
  }
}

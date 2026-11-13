import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { articlesSlug, foldersSlug, pagesSlug } from './shared.js'

export async function seed(payload: Payload) {
  await payload.create({ collection: 'users', data: devUser, overrideAccess: true })
  const folder = await payload.create({ collection: foldersSlug, data: { title: 'Editorial' } })
  const campaigns = await payload.create({
    collection: foldersSlug,
    data: { title: 'Campaigns', '_h_page-folders': folder.id },
  })
  await payload.create({ collection: foldersSlug, data: { title: 'Empty folder' } })
  for (let i = 1; i <= 12; i++) {
    await payload.create({
      collection: articlesSlug,
      data: {
        title: `Editorial article ${String(i).padStart(2, '0')}`,
        '_h_page-folders': folder.id,
      },
    })
  }
  await payload.create({
    collection: articlesSlug,
    data: { title: 'Campaign announcement', '_h_page-folders': campaigns.id },
  })
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

  const academy = await payload.create({
    collection: pagesSlug,
    data: { title: 'Academy', _status: 'published' },
  })
  const courses = await payload.create({
    collection: pagesSlug,
    data: { title: 'Courses', parent: academy.id, _status: 'published' },
  })
  await payload.create({
    collection: pagesSlug,
    data: { title: 'Getting started', parent: courses.id, _status: 'published' },
  })
  await payload.create({
    collection: pagesSlug,
    data: { title: 'Advanced training', parent: courses.id, _status: 'published' },
  })
  await payload.create({
    collection: pagesSlug,
    data: { title: 'Training events', parent: academy.id, _status: 'published' },
  })
  const account = await payload.create({
    collection: pagesSlug,
    data: { title: 'Account services', _status: 'published' },
  })
  const membership = await payload.create({
    collection: pagesSlug,
    data: { title: 'Membership', parent: account.id, _status: 'published' },
  })
  await payload.create({
    collection: pagesSlug,
    data: { title: 'Renew membership', parent: membership.id, _status: 'published' },
  })
  await payload.create({
    collection: pagesSlug,
    data: { title: 'Update your address', parent: membership.id, _status: 'published' },
  })
  await payload.create({
    collection: pagesSlug,
    data: { title: 'Billing and payments', parent: account.id, _status: 'published' },
  })
}

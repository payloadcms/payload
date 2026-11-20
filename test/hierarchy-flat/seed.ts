import type { SeedFunction } from '../__helpers/shared/clearAndSeed/testDataConfig.js'

import { devUser } from '../credentials.js'
import { articlesSlug, folderField, foldersSlug, pagesSlug } from './shared.js'

export const seed: SeedFunction = async (payload) => {
  await payload.create({
    collection: 'users',
    data: { email: devUser.email, password: devUser.password },
    overrideAccess: true,
  })

  const folder = await payload.create({
    collection: foldersSlug,
    data: { name: 'Editorial', scope: 'public' },
    overrideAccess: true,
  })

  for (const name of ['Planning', 'Published']) {
    await payload.create({
      collection: foldersSlug,
      data: { name, scope: 'public', [folderField]: folder.id },
      overrideAccess: true,
    })
  }

  for (const [collection, title] of [
    [pagesSlug, 'Home'],
    [articlesSlug, 'Autumn update'],
    [pagesSlug, 'About'],
    [articlesSlug, 'Release notes'],
  ] as const) {
    await payload.create({
      collection,
      data: { title, scope: 'public', visible: true, [folderField]: folder.id },
      overrideAccess: true,
    })
  }
}

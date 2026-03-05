import type { Payload } from 'payload'

import { foldersSlug, postsSlug, tagsSlug } from './shared.js'

export async function seed(payload: Payload): Promise<void> {
  // Create folder hierarchy
  const rootFolder = await payload.create({
    collection: foldersSlug,
    data: { name: 'Root Folder' },
  })

  const childFolder = await payload.create({
    collection: foldersSlug,
    data: { name: 'Child Folder', folder: rootFolder.id },
  })

  await payload.create({
    collection: foldersSlug,
    data: { name: 'Grandchild Folder', folder: childFolder.id },
  })

  // Create scoped folders
  await payload.create({
    collection: foldersSlug,
    data: { name: 'Posts Only Folder', folderType: [postsSlug] },
  })

  await payload.create({
    collection: foldersSlug,
    data: { name: 'Media Only Folder', folderType: ['hierarchy-media'] },
  })

  // Create tag hierarchy
  const techTag = await payload.create({
    collection: tagsSlug,
    data: { name: 'Technology' },
  })

  const programmingTag = await payload.create({
    collection: tagsSlug,
    data: { name: 'Programming', _h_hierarchyTags: techTag.id },
  })

  await payload.create({
    collection: tagsSlug,
    data: { name: 'JavaScript', _h_hierarchyTags: programmingTag.id },
  })

  await payload.create({
    collection: tagsSlug,
    data: { name: 'TypeScript', _h_hierarchyTags: programmingTag.id },
  })

  await payload.create({
    collection: tagsSlug,
    data: { name: 'Design' },
  })

  await payload.create({
    collection: tagsSlug,
    data: { name: 'DevOps' },
  })
}

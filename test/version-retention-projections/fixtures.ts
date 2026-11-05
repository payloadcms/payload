import type { Payload } from 'payload'

import { collectionSlug, globalSlug } from './shared.js'

export const data = {
  _status: { de: 'published', en: 'published' },
  panel: { rows: [{ id: 'panel-row', value: 'Tab array value' }] },
  profile: {
    content: [{ id: 'profile-card', blockType: 'card', title: 'Block value' }],
    label: { de: 'Deutsch', en: 'English' },
    nested: { value: 'Nested value' },
    note: 'Profile note',
    rows: [{ id: 'profile-row', value: 'Array value' }],
  },
  secret: 'Private fixture value',
  title: 'Fixture',
}

export const timestamp = ({ index }: { index: number }) =>
  new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString()

export const seed = async (payload: Payload) => {
  const parent = await payload.db.create({
    collection: collectionSlug,
    data: structuredClone(data),
  })
  const other = await payload.db.create({
    collection: collectionSlug,
    data: { _status: { de: 'published', en: 'published' }, title: 'Unrelated document' },
  })

  await payload.db.createGlobal({ slug: globalSlug, data: structuredClone(data) })

  for (let index = 0; index < 4; index++) {
    const date = timestamp({ index })
    const versionData = {
      ...structuredClone(data),
      createdAt: date,
      title: `Version ${index}`,
      updatedAt: date,
    }

    await payload.db.createVersion({
      autosave: false,
      collectionSlug,
      createdAt: date,
      parent: parent.id,
      returning: false,
      updatedAt: date,
      versionData: structuredClone(versionData),
    })
    await payload.db.createGlobalVersion({
      autosave: false,
      createdAt: date,
      globalSlug,
      returning: false,
      updatedAt: date,
      versionData: structuredClone(versionData),
    })
  }
  await payload.db.createVersion({
    autosave: false,
    collectionSlug,
    createdAt: timestamp({ index: 0 }),
    parent: other.id,
    returning: false,
    updatedAt: timestamp({ index: 0 }),
    versionData: structuredClone(data),
  })
}

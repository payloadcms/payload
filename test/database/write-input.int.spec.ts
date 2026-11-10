import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { writeInputSlug } from './shared.js'

test.suite('Database write input', { config: './write-input.config.ts', db: 'all' }, () => {
  test('should preserve nested input and logical row IDs when saving a version', async ({
    payload,
  }) => {
    const parent = await payload.db.create({
      collection: writeInputSlug,
      data: { title: 'Parent document' },
    })

    const versionData = {
      title: 'Version document',
      layout: [
        {
          id: '000000000000000000000001',
          blockType: 'content',
          items: [
            {
              id: '000000000000000000000002',
              settings: { label: 'Shared label' },
              translations: { en: { label: 'English' }, fr: { label: 'French' } },
            },
          ],
        },
      ],
    }

    const original = structuredClone(versionData)

    const timestamp = new Date().toISOString()

    const version = await payload.db.createVersion({
      autosave: false,
      collectionSlug: writeInputSlug,
      createdAt: timestamp,
      parent: parent.id,
      updatedAt: timestamp,
      versionData,
    })

    expect(versionData).toEqual(original)

    const stored = await payload.db.findVersions({
      collection: writeInputSlug,
      limit: 1,
      where: { id: { equals: version.id } },
    })

    expect(stored.docs).toHaveLength(1)
    expect(stored.docs[0]?.version).toMatchObject(original)
  })
})

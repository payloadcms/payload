/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { mediaSlug } from './shared.js'

const original = {
  filename: 'photo-original.jpg',
  filesize: 123,
  height: 50,
  mimeType: 'image/jpeg',
  url: '/api/file-versioned-media/file/photo-original.jpg',
  width: 100,
}

const managedFiles = [
  {
    key: 'photo-original.jpg',
    roles: [{ type: 'original' }, { type: 'default' }],
    storageBackendId: 'local:file-versioned-media',
  },
]

test.suite('File versioning fields', { config: './config.ts' }, () => {
  test('should ignore a client supplied original and manifest', async ({ payload }) => {
    const created = await payload.create({
      collection: mediaSlug,
      data: { _managedFiles: managedFiles, alt: 'client data', original } as never,
    })

    const internal = await payload.findByID({
      id: created.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })

    expect(internal.original?.filename).toBeFalsy()
    expect(internal.original?.url).toBeFalsy()
    expect(internal.original?.mimeType).toBeFalsy()
    expect(internal.original?.filesize).toBeFalsy()
    expect(internal._managedFiles).toBeFalsy()
  })

  test('should retain trusted original and manifest data in a version snapshot', async ({
    payload,
  }) => {
    const created = await payload.db.create({
      collection: mediaSlug,
      data: {
        _managedFiles: managedFiles,
        alt: 'stored data',
        original: structuredClone(original),
      },
    })

    const updated = await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: { alt: 'changed metadata' },
    })

    expect(updated.original).toMatchObject(original)
    expect(updated._managedFiles).toBeUndefined()

    const internal = await payload.findByID({
      id: created.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })

    expect(internal._managedFiles).toEqual(managedFiles)

    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: created.id } },
    })

    expect(versions[0]?.version.original).toMatchObject(original)
    expect(versions[0]?.version._managedFiles).toEqual(managedFiles)
  })
})

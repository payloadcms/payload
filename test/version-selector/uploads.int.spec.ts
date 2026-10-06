/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Integration tests use the shared fixture wrapper. */
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { uploadDirectory } from './collections/media.js'
import { draftMediaSlug as collection } from './slugs.js'

test.suite('Version selector upload preservation', { config: './upload-config.ts' }, () => {
  test.afterEach(async () => {
    await rm(uploadDirectory, { force: true, recursive: true })
  })

  for (const isDeniedByAccess of [true, false]) {
    test(`should retain live upload files when publication is ${isDeniedByAccess ? 'denied by field access' : 'rewritten by a field hook'}`, async ({
      payload,
    }) => {
      const bytes = await readFile(path.resolve('test/versions/image.png'))
      const published = await payload.create({
        collection,
        data: { title: { en: 'Published', fr: 'Publié' } },
        file: { name: 'live.png', data: bytes, mimetype: 'image/png', size: bytes.length },
        locale: 'all',
        version: 'published',
      })
      const status = payload.collections[collection].config.fields.find(
        (field) => 'name' in field && field.name === '_status',
      )!
      const previousAccess = status.access
      const previousHooks = status.hooks

      if (isDeniedByAccess) {
        status.access = { ...previousAccess, update: () => false }
      } else {
        status.hooks = { ...previousHooks, beforeChange: [() => 'draft'] }
      }
      try {
        const updated = await payload.update({
          id: published.id,
          collection,
          data: { _status: 'published', title: 'Pending replacement' },
          file: { name: 'pending.png', data: bytes, mimetype: 'image/png', size: bytes.length },
          version: 'draft',
        })
        const live = await payload.findByID({ id: published.id, collection })

        expect(updated._status).toBe('draft')
        expect(live.filename).toBe(published.filename)
        expect(await readFile(path.join(uploadDirectory, published.filename))).toEqual(bytes)
        expect(
          await readFile(path.join(uploadDirectory, published.sizes.thumbnail.filename)),
        ).not.toHaveLength(0)
      } finally {
        status.access = previousAccess
        status.hooks = previousHooks
      }
    })
  }

  test('should retain an existing pending upload when replacement validation fails', async ({
    payload,
  }) => {
    const bytes = await readFile(path.resolve('test/versions/image.png'))
    const draft = await payload.create({
      collection,
      data: {},
      file: { name: 'pending.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    await expect(
      payload.update({
        id: draft.id,
        collection,
        context: { rejectUpload: true },
        data: {},
        file: { name: 'rejected.png', data: bytes, mimetype: 'image/png', size: bytes.length },
      }),
    ).rejects.toThrow('Rejected upload replacement')
    expect(await readFile(path.join(uploadDirectory, draft.filename))).toEqual(bytes)
  })

  test('should remove an old published upload when no active copy retains it', async ({
    payload,
  }) => {
    const bytes = await readFile(path.resolve('test/versions/image.png'))
    const published = await payload.create({
      collection,
      data: { title: { en: 'English', fr: 'French' } },
      file: { name: 'old-live.png', data: bytes, mimetype: 'image/png', size: bytes.length },
      locale: 'all',
      version: 'published',
    })

    await payload.update({
      id: published.id,
      collection,
      data: {},
      file: { name: 'new-live.png', data: bytes, mimetype: 'image/png', size: bytes.length },
      locale: 'all',
      version: 'published',
    })
    await expect(readFile(path.join(uploadDirectory, published.filename))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  for (const hasPendingSnapshot of [false, true]) {
    test(`should retain published upload files when replacing ${hasPendingSnapshot ? 'a shared pending snapshot' : 'a localized draft'}`, async ({
      payload,
    }) => {
      const bytes = await readFile(path.resolve('test/versions/image.png'))
      const published = await payload.create({
        collection,
        data: { title: { en: 'Published', fr: 'Publié' } },
        file: { name: 'live.png', data: bytes, mimetype: 'image/png', size: bytes.length },
        locale: 'all',
        version: 'published',
      })

      if (hasPendingSnapshot) {
        await payload.update({ id: published.id, collection, data: { title: 'Pending metadata' } })
      }

      const draft = await payload.update({
        id: published.id,
        collection,
        data: { title: 'Replacement' },
        file: { name: 'replacement.png', data: bytes, mimetype: 'image/png', size: bytes.length },
        version: 'draft',
      })
      const live = await payload.findByID({ id: published.id, collection })

      expect(live.filename).toBe(published.filename)
      expect(await readFile(path.join(uploadDirectory, published.filename))).toEqual(bytes)
      expect(
        await readFile(path.join(uploadDirectory, published.sizes.thumbnail.filename)),
      ).not.toHaveLength(0)
      expect(draft.filename).not.toBe(published.filename)
      expect(
        (await payload.findByID({ id: published.id, collection, version: 'draft' })).filename,
      ).toBe(draft.filename)
    })
  }

  test('should retain published files when draft replacement validation fails', async ({
    payload,
  }) => {
    const bytes = await readFile(path.resolve('test/versions/image.png'))
    const published = await payload.create({
      collection,
      data: { title: { en: 'Published', fr: 'Publié' } },
      file: { name: 'live.png', data: bytes, mimetype: 'image/png', size: bytes.length },
      locale: 'all',
      version: 'published',
    })

    await expect(
      payload.update({
        id: published.id,
        collection,
        context: { rejectUpload: true },
        data: { title: 'Rejected' },
        file: { name: 'rejected.png', data: bytes, mimetype: 'image/png', size: bytes.length },
        version: 'draft',
      }),
    ).rejects.toThrow('Rejected upload replacement')
    expect(await readFile(path.join(uploadDirectory, published.filename))).toEqual(bytes)
  })

  test('should retain a pending snapshot file when replacing the published copy', async ({
    payload,
  }) => {
    const bytes = await readFile(path.resolve('test/versions/image.png'))
    const published = await payload.create({
      collection,
      data: { title: { en: 'Published', fr: 'Publié' } },
      file: { name: 'live.png', data: bytes, mimetype: 'image/png', size: bytes.length },
      locale: 'all',
      version: 'published',
    })

    await payload.update({ id: published.id, collection, data: { title: 'Pending metadata' } })
    await payload.update({
      id: published.id,
      collection,
      data: { title: 'New live file' },
      file: { name: 'new-live.png', data: bytes, mimetype: 'image/png', size: bytes.length },
      version: 'published',
    })

    expect(
      (await payload.findByID({ id: published.id, collection, version: 'draft' })).filename,
    ).toBe(published.filename)
    expect(await readFile(path.join(uploadDirectory, published.filename))).toEqual(bytes)
  })

  test('should delete an unreferenced draft file when replacing it', async ({ payload }) => {
    const bytes = await readFile(path.resolve('test/versions/image.png'))
    const draft = await payload.create({
      collection,
      data: {},
      file: { name: 'old-draft.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    await payload.update({
      id: draft.id,
      collection,
      data: {},
      file: { name: 'new-draft.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    await expect(readFile(path.join(uploadDirectory, draft.filename))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })
})

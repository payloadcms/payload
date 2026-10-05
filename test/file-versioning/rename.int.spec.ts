/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

/* eslint-disable payload/no-relative-monorepo-imports -- Rename is a core operation tested before API wrappers. */
import { renameFileOperation } from '../../packages/payload/src/collections/operations/renameFile.js'
/* eslint-enable payload/no-relative-monorepo-imports */
import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  draftMediaDir,
  draftMediaSlug,
  mediaDir,
  mediaSlug,
  plainMediaDir,
  plainMediaSlug,
  transformedMediaDir,
  transformedMediaSlug,
} from './shared.js'

const imageFixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../uploads/image.png',
)

test.suite('File rename', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await rm(mediaDir, { force: true, recursive: true })
    await rm(draftMediaDir, { force: true, recursive: true })
    await rm(transformedMediaDir, { force: true, recursive: true })
    await rm(plainMediaDir, { force: true, recursive: true })
  })

  test('should rename current files while retaining earlier version bytes', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'rename' },
      file: { name: 'before.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const renamed = await renameFileOperation({
      id: created.id,
      collection: payload.collections[mediaSlug],
      filename: 'after.png',
      overrideAccess: true,
      req: await createPayloadRequest({ payload }),
    })

    expect(renamed.filename).toBe('after-original.png')
    expect(renamed.original?.filename).toBe('after-original.png')
    expect(await readFile(path.join(mediaDir, 'after-original.png'))).toEqual(bytes)
    expect(await readFile(path.join(mediaDir, created.filename!))).toEqual(bytes)

    const { docs } = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: created.id } },
    })

    expect(docs.some(({ version }) => version.filename === created.filename)).toBe(true)
  })

  test('should rename shared original, variant, and custom thumbnail without key collisions', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const thumbnailBytes = Buffer.from('thumbnail bytes')
    await mkdir(transformedMediaDir, { recursive: true })
    await writeFile(path.join(transformedMediaDir, 'before-original.png'), bytes)
    await writeFile(path.join(transformedMediaDir, 'before-preview'), bytes)
    await writeFile(path.join(transformedMediaDir, 'preview'), thumbnailBytes)
    const created = await payload.db.create({
      collection: transformedMediaSlug,
      data: {
        _managedFiles: [
          {
            key: 'before-original.png',
            roles: [{ type: 'original' }, { type: 'default' }],
            storageBackendId: `local:${transformedMediaSlug}`,
          },
          {
            key: 'before-preview',
            roles: [{ type: 'size', sizeKey: 'small' }],
            storageBackendId: `local:${transformedMediaSlug}`,
          },
          {
            key: 'preview',
            roles: [{ type: 'thumbnail' }],
            storageBackendId: `local:${transformedMediaSlug}`,
          },
        ],
        alt: 'thumbnail',
        filename: 'before-original.png',
        filesize: bytes.length,
        mimeType: 'image/png',
        original: {
          filename: 'before-original.png',
          filesize: bytes.length,
          mimeType: 'image/png',
          url: `/api/${transformedMediaSlug}/file/before-original.png`,
        },
        thumbnailURL: `/api/${transformedMediaSlug}/file/preview`,
        url: `/api/${transformedMediaSlug}/file/before-original.png`,
        variants: {
          small: {
            filename: 'before-preview',
            filesize: bytes.length,
            mimeType: 'image/png',
            url: `/api/${transformedMediaSlug}/file/before-preview`,
          },
        },
      },
    })

    const renamed = await payload.renameFile({
      id: created.id,
      collection: transformedMediaSlug,
      filename: 'after.png',
      overrideAccess: true,
    })

    expect(renamed.filename).toBe('after-original.png')
    expect(renamed.original?.filename).toBe('after-original.png')
    expect(renamed.variants?.small?.filename).toBe('after-preview')
    expect(renamed.variants?.small?.url).toContain('/after-preview')
    const stored = await payload.db.findOne<{ _managedFiles: { key: string }[] }>({
      collection: transformedMediaSlug,
      where: { id: { equals: created.id } },
    })
    expect(stored?._managedFiles.map(({ key }) => key)).toEqual([
      'after-original.png',
      'after-preview',
      'after-preview-1',
    ])
    expect(await readFile(path.join(transformedMediaDir, 'after-original.png'))).toEqual(bytes)
    expect(await readFile(path.join(transformedMediaDir, 'after-preview'))).toEqual(bytes)
    expect(await readFile(path.join(transformedMediaDir, 'after-preview-1'))).toEqual(
      thumbnailBytes,
    )
    expect(await readFile(path.join(transformedMediaDir, 'before-original.png'))).toEqual(bytes)
    expect(await readFile(path.join(transformedMediaDir, 'before-preview'))).toEqual(bytes)
    expect(await readFile(path.join(transformedMediaDir, 'preview'))).toEqual(thumbnailBytes)
  })

  test('should rename every transformed representation without changing bytes', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'transformed' },
      file: { name: 'source.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const before = await payload.findByID({
      id: created.id,
      collection: transformedMediaSlug,
      showHiddenFields: true,
    })
    const beforeFiles = before._managedFiles!
    const beforeBytes = await Promise.all(
      beforeFiles.map(({ key }) => readFile(path.join(transformedMediaDir, key))),
    )
    const originalBytes = await readFile(path.join(transformedMediaDir, before.original!.filename!))
    const mainBytes = await readFile(path.join(transformedMediaDir, before.filename!))
    const renamed = await renameFileOperation({
      id: created.id,
      collection: payload.collections[transformedMediaSlug],
      filename: 'renamed.png',
      overrideAccess: true,
      req: await createPayloadRequest({ payload }),
    })

    expect(renamed.filename).toBe('renamed-original.png')
    expect(renamed.original?.filename).toBe('renamed-original.png')
    expect(await readFile(path.join(transformedMediaDir, renamed.original.filename))).toEqual(
      originalBytes,
    )
    expect(await readFile(path.join(transformedMediaDir, renamed.filename))).toEqual(mainBytes)
    const stored = await payload.db.findOne({
      collection: transformedMediaSlug,
      where: { id: { equals: created.id } },
    })

    const afterFiles = (stored as { _managedFiles?: typeof beforeFiles } | null)?._managedFiles
    expect(afterFiles).toHaveLength(beforeFiles.length)
    for (const [index, file] of afterFiles!.entries()) {
      expect(file.roles).toEqual(beforeFiles[index]!.roles)
      expect(file.key).not.toBe(beforeFiles[index]!.key)
      expect(await readFile(path.join(transformedMediaDir, file.key))).toEqual(beforeBytes[index])
    }
  })

  test('should leave the published upload unchanged when renaming a draft', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: draftMediaSlug,
      data: { _status: 'published', alt: 'published' },
      file: { name: 'published.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const renamed = await payload.renameFile({
      id: created.id,
      collection: draftMediaSlug,
      draft: true,
      filename: 'draft.png',
      overrideAccess: true,
    })
    const published = await payload.db.findOne({
      collection: draftMediaSlug,
      where: { id: { equals: created.id } },
    })

    expect(renamed.filename).toBe('draft-original.png')
    expect((published as { filename?: string } | null)?.filename).toBe(created.filename)
    expect(await readFile(path.join(draftMediaDir, created.filename!))).toEqual(bytes)
    expect(await readFile(path.join(draftMediaDir, 'draft-original.png'))).toEqual(bytes)
  })

  test('should reject unsafe names, extension changes, and destination collisions', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'rename' },
      file: { name: 'before.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const req = await createPayloadRequest({ payload })

    for (const filename of ['../escape.png', 'other.jpg']) {
      await expect(
        renameFileOperation({
          id: created.id,
          collection: payload.collections[mediaSlug],
          filename,
          overrideAccess: true,
          req,
        }),
      ).rejects.toThrow()
    }

    await payload.create({
      collection: mediaSlug,
      data: { alt: 'collision' },
      file: { name: 'taken.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    await expect(
      renameFileOperation({
        id: created.id,
        collection: payload.collections[mediaSlug],
        filename: 'taken.png',
        overrideAccess: true,
        req: await createPayloadRequest({ payload }),
      }),
    ).rejects.toThrow('already exists')
    expect(await readFile(path.join(mediaDir, created.filename!))).toEqual(bytes)
  })

  test('should remove the previous object after an unversioned rename', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: plainMediaSlug,
      data: { alt: 'unversioned' },
      file: { name: 'old.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    expect(created.filename).toBe('old-original.png')
    expect(created.original?.filename).toBe(created.filename)
    expect(created.original?.url).toBe(created.url)

    await renameFileOperation({
      id: created.id,
      collection: payload.collections[plainMediaSlug],
      filename: 'new.png',
      overrideAccess: true,
      req: await createPayloadRequest({ payload }),
    })

    expect(await readFile(path.join(plainMediaDir, 'new-original.png'))).toEqual(bytes)
    const saved = await payload.db.findOne({
      collection: plainMediaSlug,
      where: { id: { equals: created.id } },
    })
    expect((saved as { _managedFiles?: { key: string }[] } | null)?._managedFiles?.[0]?.key).toBe(
      'new-original.png',
    )
    await expect(readFile(path.join(plainMediaDir, created.filename!))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  test('should roll back staged copies when a later representation collides', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'partial failure' },
      file: { name: 'source.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const stored = await payload.db.findOne<{
      _managedFiles: { key: string }[]
      filename: string
      id: number | string
    }>({
      collection: transformedMediaSlug,
      where: { id: { equals: created.id } },
    })
    const secondKey = stored!._managedFiles[1]!.key
    const oldStem = path.parse(stored!.filename).name.replace(/-original$/, '')
    const target = path.join(
      transformedMediaDir,
      path.basename(secondKey).replace(oldStem, 'blocked'),
    )
    await writeFile(target, Buffer.from('collision'))

    await expect(
      renameFileOperation({
        id: created.id,
        collection: payload.collections[transformedMediaSlug],
        filename: 'blocked.png',
        overrideAccess: true,
        req: await createPayloadRequest({ payload }),
      }),
    ).rejects.toThrow('already exists')

    expect(await readFile(target)).toEqual(Buffer.from('collision'))
    expect(await readFile(path.join(transformedMediaDir, stored!.filename))).toEqual(bytes)
    const firstTarget = path.join(
      transformedMediaDir,
      path.basename(stored!._managedFiles[0]!.key).replace(oldStem, 'blocked'),
    )
    await expect(readFile(firstTarget)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  test('should expose the same rename behavior through Local, REST, and GraphQL', async ({
    payload,
    restClient,
  }) => {
    await restClient.login({ slug: 'users', credentials: devUser })
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'api' },
      file: { name: 'local.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    const local = await payload.renameFile({
      id: created.id,
      collection: mediaSlug,
      filename: 'rest.png',
    })
    expect(local.url).toContain('/rest-original.png')

    const rest = await restClient.POST(`/${mediaSlug}/${created.id}/rename`, {
      body: JSON.stringify({ filename: 'graphql.png' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const restBody = (await rest.json()) as { doc: { filename: string; url: string } }
    expect(rest.status).toBe(200)
    expect(restBody.doc.filename).toBe('graphql-original.png')
    expect(restBody.doc.url).toContain('/graphql-original.png')

    const gql = await restClient.GRAPHQL_POST({
      body: JSON.stringify({
        query: `mutation { renameFileFileVersionedMedia(id: ${JSON.stringify(created.id)}, filename: "final.png") { filename url } }`,
      }),
    })
    const gqlBody = (await gql.json()) as {
      data?: { renameFileFileVersionedMedia: { filename: string; url: string } }
      errors?: { message: string }[]
    }
    expect(gqlBody.errors).toBeUndefined()
    expect(gqlBody.data?.renameFileFileVersionedMedia.filename).toBe('final-original.png')
    expect(gqlBody.data?.renameFileFileVersionedMedia.url).toContain('/final-original.png')
  })

  test('should preserve an earlier name when first renaming a legacy upload', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    await mkdir(mediaDir, { recursive: true })
    await writeFile(path.join(mediaDir, 'legacy.png'), bytes)
    const legacy = await payload.db.create({
      collection: mediaSlug,
      data: {
        alt: 'legacy',
        filename: 'legacy.png',
        filesize: bytes.length,
        mimeType: 'image/png',
        url: `/api/${mediaSlug}/file/legacy.png`,
      },
    })

    const renamed = await payload.renameFile({
      id: legacy.id,
      collection: mediaSlug,
      filename: 'modern.png',
      overrideAccess: true,
    })
    const { docs } = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: legacy.id } },
    })

    expect(renamed.filename).toBe('modern-original.png')
    expect(await readFile(path.join(mediaDir, 'modern-original.png'))).toEqual(bytes)
    expect(await readFile(path.join(mediaDir, 'legacy.png'))).toEqual(bytes)
    expect(docs.some(({ version }) => version.filename === 'legacy.png')).toBe(true)
  })

  test('should honor draft selection in REST and GraphQL rename', async ({
    payload,
    restClient,
  }) => {
    await restClient.login({ slug: 'users', credentials: devUser })
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: draftMediaSlug,
      data: { _status: 'published', alt: 'published' },
      file: { name: 'published.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const rest = await restClient.POST(`/${draftMediaSlug}/${created.id}/rename`, {
      body: JSON.stringify({ draft: true, filename: 'rest-draft.png' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(rest.status).toBe(200)

    const gql = await restClient.GRAPHQL_POST({
      body: JSON.stringify({
        query: `mutation { renameFileFileVersionedDraftMedia(id: ${JSON.stringify(created.id)}, filename: "graphql-draft.png", draft: true) { filename } }`,
      }),
    })
    const gqlBody = (await gql.json()) as {
      data?: { renameFileFileVersionedDraftMedia: { filename: string } }
      errors?: { message: string }[]
    }
    const published = await payload.db.findOne({
      collection: draftMediaSlug,
      where: { id: { equals: created.id } },
    })

    expect(gqlBody.errors).toBeUndefined()
    expect(gqlBody.data?.renameFileFileVersionedDraftMedia.filename).toBe(
      'graphql-draft-original.png',
    )
    expect((published as { filename?: string } | null)?.filename).toBe(created.filename)
  })

  test('should enforce update access through all three rename APIs', async ({
    payload,
    restClient,
  }) => {
    await restClient.login({ slug: 'users', credentials: devUser })
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'access' },
      file: { name: 'protected.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const collection = payload.collections[mediaSlug]
    const previousAccess = collection.config.access.update
    collection.config.access.update = () => false

    try {
      await expect(
        payload.renameFile({ id: created.id, collection: mediaSlug, filename: 'denied.png' }),
      ).rejects.toThrow()
      const rest = await restClient.POST(`/${mediaSlug}/${created.id}/rename`, {
        body: JSON.stringify({ filename: 'denied.png' }),
        headers: { 'Content-Type': 'application/json' },
      })
      expect(rest.status).toBe(403)
      const gql = await restClient.GRAPHQL_POST({
        body: JSON.stringify({
          query: `mutation { renameFileFileVersionedMedia(id: ${JSON.stringify(created.id)}, filename: "denied.png") { filename } }`,
        }),
      })
      const gqlBody = (await gql.json()) as { errors?: { message: string }[] }
      expect(gqlBody.errors?.length).toBeGreaterThan(0)
      expect(await readFile(path.join(mediaDir, created.filename!))).toEqual(bytes)
    } finally {
      collection.config.access.update = previousAccess
    }
  })
})

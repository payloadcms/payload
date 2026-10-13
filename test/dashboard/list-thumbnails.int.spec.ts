/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { fileURLToPath } from 'node:url'
import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise thumbnail loading against the real database.
import { getDocumentThumbnails } from '../../packages/ui/src/views/List/getDocumentThumbnails.js'
import { test } from '../__helpers/int/vitest.js'

test.suite('List thumbnails', { config: './config.ts' }, () => {
  const uploads: Array<{ collection: 'media' | 'media-alt'; id: number | string }> = []

  test.afterEach(async ({ payload }) => {
    vi.restoreAllMocks()
    for (const upload of uploads.splice(0)) {
      await payload.delete({ ...upload, overrideAccess: true })
    }
  })

  test('should batch shared thumbnail references without populating or mutating list documents', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'list-thumbnail@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const media = await payload.create({
      collection: 'media',
      data: { previewURL: '/custom-list-thumbnail.png' },
      filePath: fileURLToPath(new URL('../select/image.jpg', import.meta.url)),
      overrideAccess: false,
      user,
    })

    uploads.push({ id: media.id, collection: 'media' })
    const docs = [
      { id: 'post-one', cover: media.id, unrelated: 'other-id' },
      { id: 'post-two', cover: media.id, unrelated: 'another-id' },
    ]
    const req = await createPayloadRequest({ payload, req: { user } })
    const find = vi.spyOn(payload, 'find')
    const result = await getDocumentThumbnails({
      collectionConfig: payload.collections['draft-posts'].config,
      docs,
      req,
    })

    expect(result.thumbnails).toEqual({
      'post-one': '/custom-list-thumbnail.png',
      'post-two': '/custom-list-thumbnail.png',
    })
    expect(result.prefetchedRelationships.documents.media[media.id]).toMatchObject({
      id: media.id,
      filename: media.filename,
      previewURL: '/custom-list-thumbnail.png',
    })
    expect(find).toHaveBeenCalledTimes(1)
    expect(find.mock.calls[0][0]).toMatchObject({
      collection: 'media',
      depth: 0,
      overrideAccess: false,
      where: { id: { in: [media.id] } },
    })
    expect(docs).toEqual([
      { id: 'post-one', cover: media.id, unrelated: 'other-id' },
      { id: 'post-two', cover: media.id, unrelated: 'another-id' },
    ])
  })

  test('should omit thumbnails the current user cannot read', async ({ payload }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'list-thumbnail-access@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const media = await payload.create({
      collection: 'media',
      data: {},
      filePath: fileURLToPath(new URL('../select/image.jpg', import.meta.url)),
      overrideAccess: false,
      user,
    })

    uploads.push({ id: media.id, collection: 'media' })
    const req = await createPayloadRequest({ payload, req: { user } })
    const previousReadAccess = payload.collections.media.config.access.read

    payload.collections.media.config.access.read = () => false
    try {
      expect(
        await getDocumentThumbnails({
          collectionConfig: payload.collections['draft-posts'].config,
          docs: [{ id: 'post-one', cover: media.id }],
          req,
        }),
      ).toMatchObject({
        thumbnails: {},
        prefetchedRelationships: { documents: { media: { [media.id]: false } } },
      })
    } finally {
      payload.collections.media.config.access.read = previousReadAccess
    }
  })

  test('should share fallback-localized upload titles while batching polymorphic thumbnails', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'list-thumbnail-polymorphic@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const media = await payload.create({
      collection: 'media',
      data: {},
      filePath: fileURLToPath(new URL('../select/image.jpg', import.meta.url)),
      overrideAccess: false,
      user,
    })
    const alternateMedia = await payload.create({
      collection: 'media-alt',
      data: { description: 'Alternate upload' },
      filePath: fileURLToPath(new URL('../select/image.jpg', import.meta.url)),
      overrideAccess: false,
      user,
    })

    uploads.push(
      { id: media.id, collection: 'media' },
      { id: alternateMedia.id, collection: 'media-alt' },
    )
    const req = await createPayloadRequest({ locale: 'es', payload, req: { user } })
    const collectionConfig = payload.collections['draft-posts'].config
    const find = vi.spyOn(payload, 'find')
    const result = await getDocumentThumbnails({
      collectionConfig: {
        ...collectionConfig,
        flattenedFields: [
          {
            name: 'cover',
            type: 'upload',
            hasMany: true,
            relationTo: ['media', 'media-alt'],
          },
        ],
      },
      docs: [
        {
          id: 'post-one',
          cover: [
            { relationTo: 'media', value: media.id },
            { relationTo: 'media-alt', value: alternateMedia.id },
          ],
        },
        { id: 'post-two', cover: [{ relationTo: 'media-alt', value: alternateMedia.id }] },
        { id: 'post-three', cover: [] },
      ],
      req,
    })

    expect(result.thumbnails).toEqual({
      'post-one': media.thumbnailURL || media.url,
      'post-two': alternateMedia.thumbnailURL || alternateMedia.url,
    })
    expect(result.prefetchedRelationships.documents['media-alt'][alternateMedia.id]).toMatchObject({
      description: 'Alternate upload',
    })
    expect(find).toHaveBeenCalledTimes(2)
    for (const [args] of find.mock.calls) {
      expect(args.depth).toBe(0)
      expect(args.overrideAccess).toBe(false)
    }
  })

  test('should reuse direct upload metadata without another query', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const find = vi.spyOn(payload, 'find')
    const result = await getDocumentThumbnails({
      collectionConfig: payload.collections.media.config,
      docs: [{ id: 'media-id', mimeType: 'image/jpeg', url: '/image.jpg' }],
      req,
    })

    expect(result.thumbnails).toEqual({ 'media-id': '/image.jpg' })
    expect(find).not.toHaveBeenCalled()
  })
})

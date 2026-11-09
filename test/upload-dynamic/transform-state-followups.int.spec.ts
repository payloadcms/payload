/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.for"] }] -- Tests use the shared fixture wrapper. */
import type { Document, FileData, Payload, TypeWithID } from 'payload'

import { readdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { expect } from 'vitest'

import { createHandleRequest } from '../../packages/transformer-sharp/src/handleRequest.js'
import { resolveSharpDynamicDefaults } from '../../packages/transformer-sharp/src/sharpTransformer.js'
import { test } from '../__helpers/int/vitest.js'
import {
  getStoredCloudFiles,
  versionedCloudFiles,
} from '../plugin-cloud-storage/versionedCloudStorage.js'
import { sourceReadCalls } from './collections/DynamicMedia.js'
import {
  dynamicMediaDir,
  dynamicMediaSlug,
  publicCloudMediaSlug,
  versionedDynamicMediaDir,
  versionedDynamicMediaSlug,
} from './shared.js'
import { requestCropCalls, signedImagePlans } from './transformers.js'

const createImage = async ({
  payload,
  collection = dynamicMediaSlug,
  transforms = null,
  prefix,
}: {
  collection?:
    | typeof dynamicMediaSlug
    | typeof publicCloudMediaSlug
    | typeof versionedDynamicMediaSlug
  payload: Payload
  prefix?: string
  transforms?: Document['_transforms']
}) => {
  const bytes = await readFile(path.resolve('test/uploads/image.png'))

  return payload.create({
    collection,
    data: { _transforms: transforms, ...(prefix ? { prefix } : {}) },
    file: { data: bytes, mimetype: 'image/png', name: 'gap.png', size: bytes.length },
  }) as Promise<FileData & TypeWithID>
}

const crop = { x: 0, y: 0, width: 800, height: 600 }

test.suite('Transform state follow-ups', { config: './config.ts' }, () => {
  let saved: {
    dynamicUpload: Payload['collections'][typeof dynamicMediaSlug]['config']['upload']
    transformers: Payload['config']['upload']['transformers']
    versionedUpload: Payload['collections'][typeof dynamicMediaSlug]['config']['upload']
  }

  test.beforeEach(({ payload }) => {
    saved = {
      transformers: payload.config.upload.transformers,
      dynamicUpload: { ...payload.collections[dynamicMediaSlug].config.upload },
      versionedUpload: { ...payload.collections[versionedDynamicMediaSlug].config.upload },
    }
  })

  test.afterEach(async ({ payload }) => {
    payload.config.upload.transformers = saved.transformers
    Object.assign(payload.collections[dynamicMediaSlug].config.upload, saved.dynamicUpload)
    Object.assign(
      payload.collections[versionedDynamicMediaSlug].config.upload,
      saved.versionedUpload,
    )
    versionedCloudFiles.clear()
    requestCropCalls.length = 0
    signedImagePlans.length = 0
    sourceReadCalls.length = 0
    await rm(dynamicMediaDir, { recursive: true, force: true })
    await rm(versionedDynamicMediaDir, { recursive: true, force: true })
  })

  test('should reject a current virtual size when its owner no longer runs', async ({
    payload,
    restClient,
  }) => {
    const created = await createImage({ payload })

    payload.config.upload.transformers = [
      {
        slug: 'unrelated-default',
        mimeTypes: ['image/*'],
        canTransform: ({ operation, purpose }) =>
          operation === 'request' && purpose === 'persisted-default',
        handleRequest: async ({ getOriginalFile }) => ({
          response: await getOriginalFile(),
          status: 'complete',
        }),
      },
    ]
    const response = await restClient.GET(
      `/${dynamicMediaSlug}/file/${created.variants.card!.filename}`,
    )
    expect(response.status).toBe(500)
    expect(sourceReadCalls).toEqual([])
  })

  test('should pass the generated MIME to a resize after conversion', async ({
    payload,
    restClient,
  }) => {
    const created = await createImage({ payload })
    const resize = createHandleRequest({
      sharpDependency: sharp,
      dynamicDefaults: resolveSharpDynamicDefaults(),
    })

    payload.config.upload.transformers = [
      {
        slug: 'request-crop',
        mimeTypes: ['image/*'],
        canTransform: ({ operation, purpose }) =>
          operation === 'request' && purpose === 'persisted-default',
        handleRequest: async ({ getOriginalFile }) => ({
          response: new Response(
            new Uint8Array(
              await sharp(Buffer.from(await (await getOriginalFile()).arrayBuffer()))
                .webp()
                .toBuffer(),
            ),
            { headers: { 'Content-Type': 'image/webp' } },
          ),
          status: 'continue',
        }),
      },
      {
        slug: 'resize',
        mimeTypes: ['image/*'],
        canTransform: ({ operation, purpose, req }) =>
          operation === 'request' &&
          purpose === 'request-override' &&
          req.searchParams.has('width'),
        handleRequest: resize,
      },
    ]
    const response = await restClient.GET(
      `/${dynamicMediaSlug}/file/${created.variants.card!.filename}?width=50`,
    )
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()

    expect(metadata).toMatchObject({ format: 'webp', width: 50 })
    expect(response.headers.get('Content-Type')).toBe('image/webp')
  })

  test('should reject unclaimed built-in keys on a fileless create', async ({ payload }) => {
    payload.collections[dynamicMediaSlug].config.upload.filesRequiredOnCreate = false
    await expect(
      payload.create({
        collection: dynamicMediaSlug,
        data: { _transforms: { rotate: { angle: 90 } } },
      }),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      data: {
        errors: [
          { path: '_transforms.rotate', message: 'No configured transformer applies this key.' },
        ],
      },
    })
  })

  test('should reject unclaimed built-in keys on an update without stored MIME', async ({
    payload,
  }) => {
    payload.collections[dynamicMediaSlug].config.upload.filesRequiredOnCreate = false
    const created = await payload.create({ collection: dynamicMediaSlug, data: {} })

    await expect(
      payload.update({
        collection: dynamicMediaSlug,
        id: created.id,
        data: { _transforms: { rotate: { angle: 90 } } },
      }),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      data: {
        errors: [
          { path: '_transforms.rotate', message: 'No configured transformer applies this key.' },
        ],
      },
    })
  })

  test('should validate malformed submitted state on a draft', async ({ payload }) => {
    const created = await createImage({ payload, collection: versionedDynamicMediaSlug })

    await expect(
      payload.update({
        collection: versionedDynamicMediaSlug,
        id: created.id,
        draft: true,
        data: { _transforms: { crop: { ...crop, width: -1 } } },
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  test.for([false, true])(
    'should reject a transformer crop outside source bounds (draft=%s)',
    async (draft, { payload }) => {
      const collection = versionedDynamicMediaSlug

      payload.collections[collection].config.upload.variants = []
      const created = await createImage({ payload, collection })
      const filesBefore = await readdir(versionedDynamicMediaDir)

      payload.config.upload.transformers = [
        {
          slug: 'invalid-crop',
          mimeTypes: ['image/*'],
          canTransform: ({ operation }) =>
            operation === 'upload' ? { canTransform: true, handledTransformKeys: ['crop'] } : false,
          transformFile: ({ doc }) => {
            doc._transforms = { crop: { x: 0, y: 0, width: 9999, height: 9999 } }
            return Promise.resolve({ status: 'continue' as const })
          },
        },
      ]
      await expect(
        payload.update({ collection, id: created.id, draft, data: { _transforms: { crop } } }),
      ).rejects.toMatchObject({
        name: 'ValidationError',
        data: {
          errors: [
            { path: '_transforms', message: 'crop: must fit inside the original (1600 x 1600)' },
          ],
        },
      })

      expect(
        (await payload.findByID({ collection, id: created.id, draft: true }))._transforms,
      ).toBeNull()
      expect(await readdir(versionedDynamicMediaDir)).toEqual(filesBefore)
    },
  )

  test('should preserve fileless metadata and unrelated legacy updates', async ({ payload }) => {
    payload.collections[dynamicMediaSlug].config.upload.filesRequiredOnCreate = false
    const created = await payload.create({
      collection: dynamicMediaSlug,
      data: { _transforms: { focalPoint: { x: 20, y: 30 }, custom: { quality: 80 } } },
    })

    await payload.db.updateOne({
      collection: dynamicMediaSlug,
      id: created.id,
      data: { _transforms: { rotate: { angle: 90 } } },
    })
    const updated = await payload.update({
      collection: dynamicMediaSlug,
      id: created.id,
      data: { alt: 'legacy metadata' },
    })

    expect(updated._transforms).toEqual({ rotate: { angle: 90 } })
    await expect(
      payload.update({ collection: dynamicMediaSlug, id: created.id, data: { _transforms: null } }),
    ).resolves.toMatchObject({ _transforms: null })
  })

  test.for(['change', 'reset'] as const)(
    'should reconcile newly registered sizes on a crop %s',
    async (edit, { payload }) => {
      const upload = payload.collections[dynamicMediaSlug].config.upload
      const variants = upload.variants

      upload.variants = []
      const created = await createImage({ payload, transforms: { crop } })

      upload.variants = variants
      const unrelated = await payload.update({
        collection: dynamicMediaSlug,
        id: created.id,
        data: { alt: 'no processing' },
      })

      expect(unrelated.variants?.card?.filename).toBeFalsy()
      const updated = await payload.update({
        collection: dynamicMediaSlug,
        id: created.id,
        data: { _transforms: edit === 'reset' ? null : { crop: { ...crop, width: 700 } } },
      })

      expect(updated.variants?.card).toMatchObject({ _stored: false, filename: expect.any(String) })
      expect(updated.original).toMatchObject({
        filename: created.original!.filename,
        filesize: created.original!.filesize,
        mimeType: created.original!.mimeType,
        width: created.original!.width,
        height: created.original!.height,
      })
    },
  )

  test.for([dynamicMediaSlug, publicCloudMediaSlug] as const)(
    'should retain a verified legacy source for later edits in %s',
    async (collection, { payload, restClient }) => {
      const created = await createImage({
        payload,
        collection,
        prefix: collection === publicCloudMediaSlug ? 'legacy-folder' : undefined,
      })
      const cloudFilesBefore = new Map(versionedCloudFiles)

      await payload.db.updateOne({
        collection,
        id: created.id,
        data: {
          original: {
            filename: null,
            url: null,
            mimeType: null,
            filesize: null,
            width: null,
            height: null,
            _objectKey: null,
            prefix: null,
          },
        },
      })
      const updated = await payload.update({
        collection,
        id: created.id,
        data: { _transforms: { crop } },
      })

      expect(updated.original).toMatchObject({
        filename: created.filename,
        mimeType: created.mimeType,
        filesize: created.filesize,
        width: created.width,
        height: created.height,
      })

      expect(updated.original?._objectKey ?? null).toBe(created._objectKey ?? null)
      expect(updated.original?.prefix ?? null).toBe(created.prefix ?? null)
      expect(versionedCloudFiles).toEqual(cloudFilesBefore)
      const sourceBytes =
        collection === publicCloudMediaSlug
          ? versionedCloudFiles.get(getStoredCloudFiles({ original: updated.original })[0]!.key)
          : await readFile(path.join(dynamicMediaDir, updated.original!.filename!))
      expect(sourceBytes).toEqual(await readFile(path.resolve('test/uploads/image.png')))
      const editedAgain = await payload.update({
        collection,
        id: created.id,
        data: { _transforms: { crop: { x: 900, y: 900, width: 500, height: 400 } } },
      })

      expect(editedAgain.original).toEqual(updated.original)
      const response = await restClient.GET(`/${collection}/file/${editedAgain.filename}`)

      expect(response.status).toBe(200)
      expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({
        width: 500,
        height: 400,
      })
    },
  )

  test.for([dynamicMediaSlug, publicCloudMediaSlug] as const)(
    'should reject adoption of a missing legacy source in %s',
    async (collection, { payload }) => {
      const created = await createImage({ payload, collection })

      await payload.db.updateOne({
        collection,
        id: created.id,
        data: {
          original: {
            filename: null,
            url: null,
            mimeType: null,
            filesize: null,
            width: null,
            height: null,
            _objectKey: null,
            prefix: null,
          },
        },
      })
      if (collection === publicCloudMediaSlug) {
        for (const { key } of getStoredCloudFiles(created)) {
          versionedCloudFiles.delete(key)
        }
      } else {
        await rm(path.join(dynamicMediaDir, created.filename))
      }
      await expect(
        payload.update({ collection, id: created.id, data: { _transforms: { crop } } }),
      ).rejects.toMatchObject({ name: 'FileRetrievalError' })
      const unchanged = await payload.db.findOne<
        { _transforms?: Document['_transforms'] } & FileData & TypeWithID
      >({
        collection,
        where: { id: { equals: created.id } },
      })

      expect(unchanged?.original?.filename).toBeFalsy()
      expect(unchanged?._transforms).toBeNull()
    },
  )
  test('should reject a legacy source handler with no readable body', async ({ payload }) => {
    const created = await createImage({ payload })

    await payload.db.updateOne({
      collection: dynamicMediaSlug,
      id: created.id,
      data: {
        original: {
          filename: null,
          url: null,
          mimeType: null,
          filesize: null,
          width: null,
          height: null,
          _objectKey: null,
          prefix: null,
        },
      },
    })
    payload.collections[dynamicMediaSlug].config.upload.handlers = [() => new Response(null)]
    await expect(
      payload.update({
        collection: dynamicMediaSlug,
        id: created.id,
        data: { _transforms: { crop } },
      }),
    ).rejects.toMatchObject({ name: 'FileRetrievalError' })
  })
})

/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options", "test.for"] }] -- Tests use the shared fixture wrapper. */
import { readdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { dynamicMediaSlug, mediaSlug } from './shared.js'

test.suite('File transform state', { config: './config.ts' }, () => {
  test('should process transform state produced by collection hooks', async ({ payload }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      context: { applyRotation: true },
      data: {},
      file: { name: 'hook.png', data, mimetype: 'image/png', size: data.length },
    })

    expect(doc).toMatchObject({ _transforms: { rotate: { angle: 90 } }, height: 20, width: 10 })
  })
  test('should replay restored intent using the current transformer implementation', async ({
    payload,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _transforms: { crop: { height: 10, width: 10, x: 0, y: 0 } } },
      file: { name: 'restore.png', data, mimetype: 'image/png', size: data.length },
    })
    const versions = await payload.findVersions({
      collection: mediaSlug,
      sort: '-createdAt',
      where: { parent: { equals: doc.id } },
    })
    const selected = versions.docs[0]

    await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { _transforms: { crop: { height: 10, width: 5, x: 0, y: 0 } } },
    })
    const transformer = payload.config.upload.transformers[0]
    const transformFile = transformer.transformFile!

    transformer.transformFile = async (args) => {
      const result = await transformFile(args)

      if (!result.file) {
        return result
      }
      const buffer = await sharp(Buffer.from(await result.file.arrayBuffer()))
        .resize(2, 2)
        .png()
        .toBuffer()

      return { ...result, file: new File([buffer], result.file.name, { type: 'image/png' }) }
    }
    try {
      const restored = await payload.restoreVersion({ id: selected.id, collection: mediaSlug })

      expect(restored).toMatchObject({
        _transforms: { crop: { height: 10, width: 10, x: 0, y: 0 } },
        height: 2,
        width: 2,
      })
      expect(
        await sharp(
          path.join(payload.collections[mediaSlug].config.upload.staticDir, restored.filename),
        ).metadata(),
      ).toMatchObject({ height: 2, width: 2 })
    } finally {
      transformer.transformFile = transformFile
    }
  })
  test('should reject invalid transformer mutations without changing the document or files', async ({
    payload,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      data: { title: 'valid' },
      file: { name: 'validation.png', data, mimetype: 'image/png', size: data.length },
    })
    const directory = payload.collections[mediaSlug].config.upload.staticDir
    const files = await readdir(directory)
    const transformer = payload.config.upload.transformers[0]
    const transformFile = transformer.transformFile!

    transformer.transformFile = async (args) => {
      args.doc.title = 'invalid'

      return transformFile(args)
    }
    try {
      await expect(
        payload.update({
          id: doc.id,
          collection: mediaSlug,
          data: { _transforms: { rotate: { angle: 90 } } },
        }),
      ).rejects.toMatchObject({ data: { errors: [expect.objectContaining({ path: 'title' })] } })
      expect(await payload.findByID({ id: doc.id, collection: mediaSlug })).toMatchObject({
        _transforms: null,
        height: 10,
        title: 'valid',
        width: 20,
      })
      expect(await readdir(directory)).toEqual(files)
    } finally {
      transformer.transformFile = transformFile
    }
  })
  test('should validate nested transformer mutations against a detached baseline', async ({
    payload,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      data: { appliedState: { title: 'valid' } },
      file: { name: 'nested.png', data, mimetype: 'image/png', size: data.length },
    })
    const transformer = payload.config.upload.transformers[0]
    const transformFile = transformer.transformFile!

    transformer.transformFile = async (args) => {
      args.doc.appliedState.title = 'invalid'
      return transformFile(args)
    }
    try {
      await expect(
        payload.update({
          id: doc.id,
          collection: mediaSlug,
          data: { _transforms: { rotate: { angle: 90 } } },
        }),
      ).rejects.toMatchObject({
        data: { errors: [expect.objectContaining({ path: 'appliedState' })] },
      })
      expect(await payload.findByID({ id: doc.id, collection: mediaSlug })).toMatchObject({
        appliedState: { title: 'valid' },
      })
    } finally {
      transformer.transformFile = transformFile
    }
  })

  test('should detect source MIME before validating image encoding intent', async ({ payload }) => {
    const data = await createImageBuffer({ format: 'jpeg' })
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _transforms: { encoding: { quality: 75 } } },
      file: { name: 'source.bin', data, mimetype: 'application/octet-stream', size: data.length },
    })

    expect(doc.mimeType).toBe('image/jpeg')
    expect(doc.original.mimeType).toBe('image/jpeg')
  })

  test('should preflight saved intent before retrieving a duplicate source', async ({
    payload,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _transforms: { rotate: { angle: 90 } } },
      file: { name: 'missing-duplicate.png', data, mimetype: 'image/png', size: data.length },
    })
    const transformers = payload.config.upload.transformers

    payload.config.upload.transformers = []
    await rm(
      path.join(payload.collections[mediaSlug].config.upload.staticDir, doc.original.filename),
    )
    try {
      await expect(payload.duplicate({ id: doc.id, collection: mediaSlug })).rejects.toThrow(
        'rotate',
      )
    } finally {
      payload.config.upload.transformers = transformers
    }
  })

  test('should create a request-only default without claiming the original as the default', async ({
    payload,
    restClient,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: dynamicMediaSlug,
      data: { _transforms: { crop: { height: 10, width: 5, x: 0, y: 0 } } },
      file: { name: 'initial-dynamic.png', data, mimetype: 'image/png', size: data.length },
    })

    expect(doc.filename).not.toBe(doc.original.filename)
    const files = await readdir(payload.collections[dynamicMediaSlug].config.upload.staticDir)

    expect(files).toContain(doc.original.filename)
    expect(files).not.toContain(doc.filename)
    for (const variant of Object.values(doc.variants)) {
      expect(files).not.toContain(variant.filename)
    }
    const response = await restClient.GET(`/${dynamicMediaSlug}/file/${doc.filename}`)

    expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({
      height: 10,
      width: 5,
    })
    const original = await restClient.GET(`/${dynamicMediaSlug}/file/${doc.original.filename}`)

    expect(await sharp(Buffer.from(await original.arrayBuffer())).metadata()).toMatchObject({
      height: 10,
      width: 20,
    })
  })

  test('should render virtual named variants from the saved default', async ({
    payload,
    restClient,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: dynamicMediaSlug,
      data: { _transforms: { crop: { height: 10, width: 5, x: 0, y: 0 } } },
      file: { name: 'variant.png', data, mimetype: 'image/png', size: data.length },
    })
    const response = await restClient.GET(
      `/${dynamicMediaSlug}/file/${doc.variants.square.filename}`,
    )

    expect(response.status).toBe(200)
    expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({
      height: 3,
      width: 3,
    })
  })

  test('should round-trip open transform state through REST and validate built-in keys', async ({
    restClient,
  }) => {
    const response = await restClient.POST(`/${mediaSlug}`, {
      body: JSON.stringify({ _transforms: { vendor: { values: [1, 'a', true, null] } } }),
    })
    const { doc } = await response.json()

    expect(response.status).toBe(201)
    expect(doc._transforms).toEqual({ vendor: { values: [1, 'a', true, null] } })
    const invalid = await restClient.PATCH(`/${mediaSlug}/${doc.id}`, {
      body: JSON.stringify({ _transforms: { focalPoint: { x: 101, y: 0 } } }),
    })

    expect(invalid.status).toBe(400)
    expect((await invalid.json()).errors[0].data.errors[0]).toMatchObject({
      path: '_transforms.focalPoint.x',
    })
    const read = await restClient.GET(`/${mediaSlug}/${doc.id}`)

    expect((await read.json())._transforms).toEqual(doc._transforms)
  })

  test('should leave optional custom-definition validation to adapters', async ({ restClient }) => {
    const response = await restClient.POST(`/${mediaSlug}`, {
      body: JSON.stringify({ _transforms: { unregistered: { value: true }, watermark: 42 } }),
    })
    const { doc } = await response.json()

    expect(response.status).toBe(201)
    expect(doc._transforms).toEqual({ unregistered: { value: true }, watermark: 42 })
  })

  test('should expose transform state as writable GraphQL JSON', async ({ restClient }) => {
    const state = { rotate: { angle: 90 }, vendor: { values: [1, 'a', true, null] } }
    const response = await restClient.GRAPHQL_POST({
      body: JSON.stringify({
        query:
          'mutation State($state: JSON!) { createTransformStateMedia(data: { _transforms: $state }) { id _transforms } }',
        variables: { state },
      }),
    })
    const result = await response.json()

    expect(result.errors).toBeUndefined()
    expect(result.data.createTransformStateMedia._transforms).toEqual(state)
  })

  test.for([
    {
      filename: 'christmas-mariachi-in-guadalajara.mp4',
      mimeType: 'video/mp4',
      state: {
        clip: { endMs: 1000, startMs: 0 },
        crop: { height: 10, width: 10, x: 0, y: 0 },
        encoding: { videoBitrate: 1000000, videoCodec: 'h264' },
      },
    },
    {
      filename: 'test-pdf.pdf',
      mimeType: 'application/pdf',
      state: {
        encoding: { downsampleImagesToDpi: 72, linearize: true },
        metadataPolicy: { mode: 'strip' },
        pageRange: { endPage: 1, startPage: 1 },
      },
    },
  ])(
    'should pass built-in media intent unchanged to the $mimeType executor',
    async ({ filename, mimeType, state }, { payload }) => {
      const data = await readFile(new URL(`../uploads/${filename}`, import.meta.url))
      const doc = await payload.create({
        collection: mediaSlug,
        data: { _transforms: state },
        file: { name: filename, data, mimetype: mimeType, size: data.length },
      })

      expect(doc.appliedState).toEqual(state)
      expect(doc.entryMimeType).toBe(mimeType)
      expect(doc.original.mimeType).toBe(mimeType)
      expect(doc.mimeType).toBe(mimeType)
    },
  )

  test('should process hook-generated intent on updates and bulk updates', async ({ payload }) => {
    const data = await createImageBuffer({})
    const created = await payload.create({
      collection: mediaSlug,
      data: {},
      file: { name: 'update-hook.png', data, mimetype: 'image/png', size: data.length },
    })
    const updated = await payload.update({
      id: created.id,
      collection: mediaSlug,
      context: { applyRotation: true },
      data: { title: 'hook update' },
    })

    expect(updated).toMatchObject({ _transforms: { rotate: { angle: 90 } }, height: 20, width: 10 })
    await payload.update({ id: created.id, collection: mediaSlug, data: { _transforms: null } })
    const bulk = await payload.update({
      collection: mediaSlug,
      context: { applyRotation: true },
      data: { title: 'bulk hook update' },
      where: { id: { equals: created.id } },
    })

    expect(bulk.errors).toEqual([])
    expect(bulk.docs[0]).toMatchObject({
      _transforms: { rotate: { angle: 90 } },
      height: 20,
      width: 10,
    })
  })

  test('should clear omitted intent when replacing the original and preserve explicit compatible intent', async ({
    payload,
  }) => {
    const data = await createImageBuffer({})
    const file = { name: 'replace.png', data, mimetype: 'image/png', size: data.length }
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _transforms: { crop: { height: 5, width: 5, x: 0, y: 0 } } },
      file,
    })
    const replaced = await payload.update({ id: doc.id, collection: mediaSlug, data: {}, file })

    expect(replaced).toMatchObject({ _transforms: null, height: 10, width: 20 })
    const explicit = await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { _transforms: { rotate: { angle: 90 } } },
      file,
    })

    expect(explicit).toMatchObject({
      _transforms: { rotate: { angle: 90 } },
      height: 20,
      width: 10,
    })
  })
  test('should preserve stored intent without an executor and fail restore before copying files', async ({
    payload,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _transforms: { crop: { height: 5, width: 5, x: 0, y: 0 } } },
      file: { name: 'executor.png', data, mimetype: 'image/png', size: data.length },
    })
    const versions = await payload.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: doc.id } },
    })
    const directory = payload.collections[mediaSlug].config.upload.staticDir
    const files = await readdir(directory)
    const transformers = payload.config.upload.transformers

    payload.config.upload.transformers = []
    try {
      const updated = await payload.update({
        id: doc.id,
        collection: mediaSlug,
        data: { title: 'metadata edit' },
      })

      expect(updated._transforms).toEqual(doc._transforms)
      await expect(
        payload.restoreVersion({ id: versions.docs[0].id, collection: mediaSlug }),
      ).rejects.toThrow('No configured transformer handles saved transform crop')
      expect(await readdir(directory)).toEqual(files)
      expect((await payload.findByID({ id: doc.id, collection: mediaSlug })).title).toBe(
        'metadata edit',
      )
    } finally {
      payload.config.upload.transformers = transformers
    }
  })

  test('should duplicate intent with independently owned retained files', async ({ payload }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _transforms: { crop: { height: 5, width: 5, x: 0, y: 0 } } },
      file: { name: 'duplicate.png', data, mimetype: 'image/png', size: data.length },
    })
    const duplicate = await payload.duplicate({ id: doc.id, collection: mediaSlug })

    expect(duplicate._transforms).toEqual(doc._transforms)
    expect(duplicate.original.filename).not.toBe(doc.original.filename)
    const directory = payload.collections[mediaSlug].config.upload.staticDir

    expect(await readFile(path.join(directory, duplicate.original.filename))).toEqual(data)
  })

  test.options(
    'should roll back failed transform writes and remove staged files',
    { db: (adapter) => adapter === 'postgres' || adapter === 'mongodb' },
    async ({ payload }) => {
      const data = await createImageBuffer({})
      const doc = await payload.create({
        collection: mediaSlug,
        data: {},
        file: { name: 'rollback.png', data, mimetype: 'image/png', size: data.length },
      })
      const directory = payload.collections[mediaSlug].config.upload.staticDir
      const files = await readdir(directory)

      await expect(
        payload.update({
          id: doc.id,
          collection: mediaSlug,
          context: { rejectAfterChange: true },
          data: { _transforms: { rotate: { angle: 90 } } },
        }),
      ).rejects.toThrow('Rejected transform write.')
      expect(await payload.findByID({ id: doc.id, collection: mediaSlug })).toMatchObject({
        _transforms: null,
        filename: doc.filename,
        height: 10,
        width: 20,
      })
      expect(await readdir(directory)).toEqual(files)
    },
  )

  test('should carry intent through draft and publish while sharing the original', async ({
    payload,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _status: 'published' },
      file: { name: 'draft.png', data, mimetype: 'image/png', size: data.length },
    })
    const draft = await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { _transforms: { crop: { height: 5, width: 5, x: 0, y: 0 } } },
      draft: true,
    })
    const published = await payload.findByID({ id: doc.id, collection: mediaSlug, draft: false })

    expect(draft.original.filename).toBe(doc.original.filename)
    expect(published._transforms).toBeNull()
    const publish = await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { _status: 'published' },
    })

    expect(publish._transforms).toEqual(draft._transforms)
    expect(publish.original.filename).toBe(doc.original.filename)
  })
  test.afterEach(async ({ payload }) => {
    await rm(payload.collections[mediaSlug].config.upload.staticDir, {
      force: true,
      recursive: true,
    })
    await rm(payload.collections[dynamicMediaSlug].config.upload.staticDir, {
      force: true,
      recursive: true,
    })
  })

  test('should save request-time intent without writing a derived file', async ({
    payload,
    restClient,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: dynamicMediaSlug,
      data: {},
      file: { name: 'dynamic.png', data, mimetype: 'image/png', size: data.length },
    })
    const directory = payload.collections[dynamicMediaSlug].config.upload.staticDir
    const filesBefore = await readdir(directory)
    const updated = await payload.update({
      id: doc.id,
      collection: dynamicMediaSlug,
      data: { _transforms: { crop: { height: 10, width: 5, x: 0, y: 0 } } },
    })

    expect(await readdir(directory)).toEqual(filesBefore)
    expect(updated.filename).not.toBe(updated.original.filename)
    const response = await restClient.GET(`/${dynamicMediaSlug}/file/${updated.filename}`)
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()

    expect(metadata).toMatchObject({ height: 10, width: 5 })
    const originalResponse = await restClient.GET(
      `/${dynamicMediaSlug}/file/${updated.original.filename}`,
    )
    const originalMetadata = await sharp(
      Buffer.from(await originalResponse.arrayBuffer()),
    ).metadata()

    expect(originalMetadata).toMatchObject({ height: 10, width: 20 })
  })

  test('should replay changed crop state from the retained original and reset reversibly', async ({
    payload,
  }) => {
    const data = await createImageBuffer({})
    const doc = await payload.create({
      collection: mediaSlug,
      data: {},
      file: { name: 'source.png', data, mimetype: 'image/png', size: data.length },
    })
    const cropped = await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { _transforms: { crop: { height: 10, width: 10, x: 10, y: 0 } } },
    })

    expect(cropped).toMatchObject({
      _transforms: { crop: { height: 10, width: 10, x: 10, y: 0 } },
      height: 10,
      width: 10,
    })
    const recropped = await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { _transforms: { crop: { height: 10, width: 5, x: 0, y: 0 } } },
    })

    expect(recropped).toMatchObject({ height: 10, width: 5 })
    expect(recropped.original).toEqual(doc.original)
    const reset = await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { _transforms: null },
    })

    expect(reset).toMatchObject({
      _transforms: null,
      filename: doc.original.filename,
      height: 10,
      width: 20,
    })
    const metadata = await sharp(
      path.join(payload.collections[mediaSlug].config.upload.staticDir, reset.filename),
    ).metadata()

    expect(metadata).toMatchObject({ height: 10, width: 20 })
  })

  test('should preserve omitted transform state', async ({ payload }) => {
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _transforms: { rotate: { angle: 90 } } },
    })
    const updated = await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { title: 'updated' },
    })

    expect(updated._transforms).toEqual({ rotate: { angle: 90 } })
  })

  test('should replace the complete transform object', async ({ payload }) => {
    const doc = await payload.create({
      collection: mediaSlug,
      data: { _transforms: { custom: 1, rotate: { angle: 90 } } },
    })
    const updated = await payload.update({
      id: doc.id,
      collection: mediaSlug,
      data: { _transforms: { custom: 2 } },
    })

    expect(updated._transforms).toEqual({ custom: 2 })
  })

  test.for([null, {}])(
    'should clear transform state with $value',
    async (_transforms, { payload }) => {
      const doc = await payload.create({
        collection: mediaSlug,
        data: { _transforms: { custom: 1 } },
      })
      const updated = await payload.update({
        id: doc.id,
        collection: mediaSlug,
        data: { _transforms },
      })

      expect(updated._transforms).toBeNull()
    },
  )
})

async function createImageBuffer({ format = 'png' }: { format?: 'jpeg' | 'png' }) {
  return sharp({ create: { background: 'red', channels: 3, height: 10, width: 20 } })
    .toFormat(format)
    .toBuffer()
}

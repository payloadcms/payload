/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.for"] }] -- Tests use the shared fixture wrapper. */
import type { Document, Payload } from 'payload'

import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { expect } from 'vitest'

import { createHandleRequest } from '../../packages/transformer-sharp/src/handleRequest.js'
import { resolveSharpDynamicDefaults } from '../../packages/transformer-sharp/src/sharpTransformer.js'
import { test } from '../__helpers/int/vitest.js'
import { sourceReadCalls } from './collections/DynamicMedia.js'
import {
  dynamicMediaDir,
  dynamicMediaSlug,
  versionedDynamicMediaDir,
  versionedDynamicMediaSlug,
} from './shared.js'
import { requestCropCalls, signedImagePlans } from './transformers.js'

const createImage = async ({
  payload,
  collection = dynamicMediaSlug,
  transforms = null,
}: {
  collection?: typeof dynamicMediaSlug | typeof versionedDynamicMediaSlug
  payload: Payload
  transforms?: Document['_transforms']
}) => {
  const bytes = await readFile(path.resolve('test/uploads/image.png'))
  return payload.create({
    collection,
    data: { _transforms: transforms },
    file: { data: bytes, mimetype: 'image/png', name: 'gap.png', size: bytes.length },
  })
}

test.suite('Transform state follow-ups', { config: './config.ts' }, () => {
  let saved: {
    dynamicUpload: Payload['collections'][string]['config']['upload']
    transformers: Payload['config']['upload']['transformers']
    versionedUpload: Payload['collections'][string]['config']['upload']
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
      `/${dynamicMediaSlug}/file/${created.variants.card.filename}`,
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
      `/${dynamicMediaSlug}/file/${created.variants.card.filename}?width=50`,
    )
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    expect(metadata).toMatchObject({ format: 'webp', width: 50 })
    expect(response.headers.get('Content-Type')).toBe('image/webp')
  })
})

import type { CollectionSlug, Payload, UploadTransformer } from 'payload'

import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'

import { test } from '../int/vitest.js'

const here = dirname(fileURLToPath(import.meta.url))
const sourceImagePath = resolve(here, '../../uploads/image.png')

const proveSourceHashParam = 'proveSourceHash'

/**
 * Reads the real source bytes via `getSourceFile()` and echoes their SHA-256
 * hash back as a response header, proving `operation: 'transform'` retrieval
 * returns the actual object body rather than whatever the adapter would send
 * a browser (signed-download redirect, 304, 416, rewritten headers).
 */
export const proveSourceHashTransformer: UploadTransformer = {
  slug: 'prove-source-hash',
  canTransform: ({ req }) => req.searchParams?.has(proveSourceHashParam) ?? false,
  handleRequest: async ({ getSourceFile }) => {
    const source = await getSourceFile()
    const bytes = Buffer.from(await source.arrayBuffer())
    const hash = createHash('sha256').update(bytes).digest('hex')

    return {
      response: new Response(bytes, {
        headers: { ...Object.fromEntries(source.headers), 'X-Source-Hash': hash },
        status: source.status,
      }),
      status: 'complete',
    }
  },
  mimeTypes: ['image/*'],
}

/**
 * Registers an integration test proving a storage adapter hands transformers
 * the full, real object body: a request carrying an unsatisfiable `Range` and a
 * matching `If-None-Match` must still yield a `200` whose source hash equals the
 * original file. Requires `proveSourceHashTransformer` in `upload.transformers`,
 * and `collection` must store the original unmodified (no `resizeOptions`).
 */
export function runTransformReadsRealSourceTest({
  collection,
  etagRequestHeaders,
}: {
  collection: CollectionSlug
  /**
   * Extra headers for the plain GET used to capture the ETag, e.g. to bypass a
   * signed-download redirect that would otherwise carry no ETag.
   */
  etagRequestHeaders?: Record<string, string>
}): void {
  test('should read the real object body for a transform-source request, ignoring Range and If-None-Match', async ({
    payload,
    restClient,
  }) => {
    const originalHash = createHash('sha256').update(readFileSync(sourceImagePath)).digest('hex')

    const createArgs = {
      collection,
      data: {},
      filePath: sourceImagePath,
      overrideAccess: true,
    } as unknown as Parameters<Payload['create']>[0]
    const doc = (await payload.create(createArgs)) as unknown as {
      id: number | string
      url: string
    }

    try {
      // `doc.url` keeps adapter-specific query params such as `?prefix=`
      const fileURL = new URL(doc.url.replace(/^\/api/, ''), 'http://localhost')
      const filePath = `${fileURL.pathname}${fileURL.search}` as `/${string}`

      const plainResponse = await restClient.GET(filePath, { headers: etagRequestHeaders })
      const etag = plainResponse.headers.get('ETag')

      fileURL.searchParams.set(proveSourceHashParam, '1')

      const response = await restClient.GET(
        `${fileURL.pathname}${fileURL.search}` as `/${string}`,
        {
          headers: {
            Range: 'bytes=999999999-',
            ...(etag ? { 'If-None-Match': etag } : {}),
          },
        },
      )

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Source-Hash')).toBe(originalHash)
    } finally {
      await payload.delete({ id: doc.id, collection, overrideAccess: true })
    }
  })
}

import type { CollectionSlug, Payload } from 'payload'

import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { generatePayloadFileURL, getFileByPath } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'
import { resizePreviewMediaSlug, transformerMediaSlug, usersSlug } from './shared.js'
import {
  resetTransformerCallCounts,
  resetTransformerMediaHookCallCounts,
  transformerCallCounts,
  transformerMediaHookCallCounts,
} from './transformerFixtures.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient
let payload: Payload

test.suite('Upload transformers', { config: './config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(async ({ payloadInstance, restClientInstance }) => {
    payload = payloadInstance
    restClient = restClientInstance

    await restClient.login({ slug: usersSlug })
  })

  test.describe('File transformers', () => {
    const docIDs: (number | string)[] = []
    let originalPdfText: string

    test.beforeAll(() => {
      originalPdfText = fs.readFileSync(path.resolve(dirname, '../uploads/test-pdf.pdf'), 'utf-8')
    })

    test.afterEach(async () => {
      resetTransformerCallCounts()
      for (const id of docIDs) {
        try {
          await payload.delete({
            id,
            collection: transformerMediaSlug as CollectionSlug,
            overrideAccess: true,
          })
        } catch {
          // noop — file may already have been deleted
        }
      }
      docIDs.length = 0
    })

    const uploadTransformerFixture = async (data: Record<string, unknown> = {}) => {
      const filePath = path.resolve(dirname, '../uploads/test-pdf.pdf')
      const file = await getFileByPath(filePath)
      const doc = await payload.create({
        collection: transformerMediaSlug as CollectionSlug,
        data,
        file,
        overrideAccess: true,
      })
      docIDs.push(doc.id)
      return doc as unknown as { filename: string; id: number | string }
    }

    test('should serve the original file when no recognized query parameter is present', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}`)

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(originalPdfText)
    })

    test('should run a single-stage transformer and return its transformed bytes', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1`,
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(`${originalPdfText}-suffix`)
    })

    test('should run every eligible transformer in declaration order for a multi-stage pipeline', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1&uppercase=1`,
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(`${originalPdfText}-suffix`.toUpperCase())
    })

    test('should return a redirect from a transformer that never touches the source', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?redirect=1`,
        { redirect: 'manual' },
      )

      expect(response.status).toBe(302)
      expect(response.headers.get('Location')).toBe('https://example.com/redirected')
      expect(transformerCallCounts.redirect).toBe(1)
    })

    test('should preserve the accumulator when a stage returns continue without a replacement', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}?noop=1`)

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(originalPdfText)
      expect(transformerCallCounts.noop).toBe(1)
    })

    test('should abort the pipeline with 500 when a transformer throws', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?throwerror=1`,
      )

      expect(response.status).toBe(500)
      expect(transformerCallCounts.throwing).toBe(1)
    })

    test('should abort the pipeline with 500 when a transformer consumes its source and then throws', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?sourceerror=1`,
      )

      expect(response.status).toBe(500)
      expect(transformerCallCounts.sourceConsumingError).toBe(1)
    })

    test('should abort the pipeline with 500 when a transformer consumes its source but returns no response', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?consumenoresponse=1`,
      )

      expect(response.status).toBe(500)
      expect(transformerCallCounts.consumeWithoutResponse).toBe(1)
    })

    test('should give a transformer the full source file even when the request has a Range header', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1`,
        { headers: { Range: 'bytes=0-9' } },
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(`${originalPdfText}-suffix`)
    })

    test('should return 404 for a filename with no matching upload document', async () => {
      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/does-not-exist.html?suffix=1`,
      )

      expect(response.status).toBe(404)
    })

    test('should allow an anonymous ordinary read but deny an anonymous dynamic-transform request', async () => {
      const doc = await uploadTransformerFixture()

      const ordinaryRead = await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}`, {
        auth: false,
      })
      expect(ordinaryRead.status).toBe(200)

      const transformRead = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1`,
        { auth: false },
      )
      expect(transformRead.status).toBe(403)
      // A denied request never reaches the transformer pipeline at all.
      expect(transformerCallCounts.appendSuffix).toBe(0)
    })

    test('should return 403, not 404, for an anonymous dynamic-transform request against a non-existent filename', async () => {
      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/does-not-exist.html?suffix=1`,
        { auth: false },
      )

      expect(response.status).toBe(403)
    })

    test('should allow an authenticated dynamic-transform request', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1`,
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(`${originalPdfText}-suffix`)
    })

    test('should return 403 for a dynamic-transform request with a non-matching prefix, matching the existing checkFileAccess-only path', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1&prefix=nonexistent`,
      )

      expect(response.status).toBe(403)
    })

    test('should never persist dynamic output: the document is unchanged after a transform request', async () => {
      const doc = await uploadTransformerFixture()

      await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}?suffix=1&uppercase=1`)

      const afterRequest = await payload.findByID({
        id: doc.id,
        collection: transformerMediaSlug as CollectionSlug,
        overrideAccess: true,
      })

      expect(afterRequest.filename).toBe(doc.filename)
    })

    test('should never persist dynamic output: no document-mutation hook fires for a transform request', async () => {
      const doc = await uploadTransformerFixture()
      resetTransformerMediaHookCallCounts()

      await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}?suffix=1&uppercase=1`)

      expect(transformerMediaHookCallCounts).toEqual({
        afterChange: 0,
        beforeChange: 0,
        beforeDelete: 0,
      })
    })

    test('should build a Payload-routed URL via generatePayloadFileURL that still enforces access control, even when the caller supplies an unrelated cloud-host url', async () => {
      const doc = await uploadTransformerFixture()

      // A caller (e.g. a plugin or export feature) building a link from just a
      // filename — not the document's own possibly-external `url` field — must
      // still land on Payload's access-controlled endpoint, not bypass it.
      const argsWithIgnoredCloudUrl = {
        collectionSlug: transformerMediaSlug,
        config: payload.config,
        filename: doc.filename,
        query: { suffix: true },
        relative: true,
        url: 'https://cdn.example.com/should-be-ignored.pdf',
      }
      const consumerBuiltPath = generatePayloadFileURL(
        argsWithIgnoredCloudUrl as unknown as Parameters<typeof generatePayloadFileURL>[0],
      )
      const pathWithoutAPIPrefix = consumerBuiltPath.replace(payload.config.routes.api, '')

      const anonymousResponse = await restClient.GET(pathWithoutAPIPrefix as `/${string}`, {
        auth: false,
      })
      expect(anonymousResponse.status).toBe(403)

      const authenticatedResponse = await restClient.GET(pathWithoutAPIPrefix as `/${string}`)
      expect(authenticatedResponse.status).toBe(200)
      expect(await authenticatedResponse.text()).toBe(`${originalPdfText}-suffix`)
    })
  })

  test.describe('Sharp dynamic resizing', () => {
    const docIDs: (number | string)[] = []

    test.afterEach(async () => {
      for (const id of docIDs) {
        try {
          await payload.delete({
            id,
            collection: resizePreviewMediaSlug as CollectionSlug,
            overrideAccess: true,
          })
        } catch {
          // noop — file may already have been deleted
        }
      }
      docIDs.length = 0
    })

    const uploadFixture = async (fixtureFilename: string) => {
      const filePath = path.resolve(dirname, `../uploads/${fixtureFilename}`)
      const file = await getFileByPath(filePath)
      const doc = await payload.create({
        collection: resizePreviewMediaSlug as CollectionSlug,
        data: {},
        file,
        overrideAccess: true,
      })
      docIDs.push(doc.id)
      return doc as unknown as { filename: string; id: number | string }
    }

    test('should resize by width only, preserving aspect ratio', async () => {
      const doc = await uploadFixture('image.png') // 1600x1600

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=200`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(200)
      expect(metadata.height).toBe(200)
    })

    test('should resize by height only, preserving aspect ratio', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?height=100`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.height).toBe(100)
      expect(metadata.width).toBe(100)
    })

    test('should resize by width and height together', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=300&height=150`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(300)
      expect(metadata.height).toBe(150)
    })

    test('should replace the source representation headers on a resized response', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=200`,
      )
      const body = await response.arrayBuffer()

      expect(response.headers.get('content-type')).toBe('image/png')
      expect(response.headers.get('content-length')).toBe(String(body.byteLength))
      expect(response.headers.get('etag')).toBeNull()
      expect(response.headers.get('last-modified')).toBeNull()
      expect(response.headers.get('accept-ranges')).toBeNull()
    })

    test('should return 400 for an invalid resize parameter', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=not-a-number`,
      )

      expect(response.status).toBe(400)
    })

    // A repeated `?width=` query parameter is covered at the unit level
    // (parseDynamicResize.spec.ts) — NextRESTClient's
    // qs-based query parsing collapses duplicate keys to the last value before
    // the request is ever sent, so it cannot be exercised through this client.

    test('should upscale a smaller-than-requested image by default', async () => {
      const doc = await uploadFixture('small.png') // 320x80

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=640`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(640)
    })

    test('should not upscale when withoutEnlargement=true is requested', async () => {
      const doc = await uploadFixture('small.png') // 320x80

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=640&withoutEnlargement=true`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(320)
    })

    test('should return 416 for a Range header on a recognized dynamic resize request', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=200`,
        {
          headers: { Range: 'bytes=0-99' },
        },
      )

      expect(response.status).toBe(416)
    })

    test('should ignore unrelated query keys and serve the original image unchanged', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?draft=true`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(1600)
      expect(metadata.height).toBe(1600)
    })

    test('should never persist dynamic output: the stored file is byte-identical before and after a resize request', async () => {
      const doc = await uploadFixture('image.png')
      const storedFilePath = path.resolve(dirname, './media', doc.filename)
      const beforeHash = createHash('sha256').update(fs.readFileSync(storedFilePath)).digest('hex')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=200`,
      )
      expect(response.status).toBe(200)

      const afterHash = createHash('sha256').update(fs.readFileSync(storedFilePath)).digest('hex')
      expect(afterHash).toBe(beforeHash)
    })
  })
})

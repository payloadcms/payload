import type { CollectionSlug, Payload } from 'payload'

import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { generatePayloadFileURL, getFileByPath } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
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

describe('Upload transformers', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await restClient.login({ slug: usersSlug })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('File transformers', () => {
    const docIDs: (number | string)[] = []
    let originalPdfText: string

    beforeAll(() => {
      originalPdfText = fs.readFileSync(path.resolve(dirname, './test-pdf.pdf'), 'utf-8')
    })

    afterEach(async () => {
      resetTransformerCallCounts()
      for (const id of docIDs) {
        try {
          await payload.delete({ id, collection: transformerMediaSlug as CollectionSlug })
        } catch {
          // noop — file may already have been deleted
        }
      }
      docIDs.length = 0
    })

    const uploadTransformerFixture = async (data: Record<string, unknown> = {}) => {
      const filePath = path.resolve(dirname, './test-pdf.pdf')
      const file = await getFileByPath(filePath)
      const doc = await payload.create({
        collection: transformerMediaSlug as CollectionSlug,
        data,
        file,
      })
      docIDs.push(doc.id)
      return doc as unknown as { filename: string; id: number | string }
    }

    it('should serve the original file when no recognized query parameter is present', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}`)

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(originalPdfText)
    })

    it('should run a single-stage transformer and return its transformed bytes', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1`,
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(`${originalPdfText}-suffix`)
    })

    it('should run every eligible transformer in declaration order for a multi-stage pipeline', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1&uppercase=1`,
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(`${originalPdfText}-suffix`.toUpperCase())
    })

    it('should return a redirect from a transformer that never touches the source', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?redirect=1`,
        { redirect: 'manual' },
      )

      expect(response.status).toBe(302)
      expect(response.headers.get('Location')).toBe('https://example.com/redirected')
      expect(transformerCallCounts.redirect).toBe(1)
    })

    it('should preserve the accumulator when a stage returns continue without a replacement', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}?noop=1`)

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(originalPdfText)
      expect(transformerCallCounts.noop).toBe(1)
    })

    it('should abort the pipeline with 500 when a transformer throws', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?throwerror=1`,
      )

      expect(response.status).toBe(500)
      expect(transformerCallCounts.throwing).toBe(1)
    })

    it('should abort the pipeline with 500 when a transformer consumes its source and then throws', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?sourceerror=1`,
      )

      expect(response.status).toBe(500)
      expect(transformerCallCounts.sourceConsumingError).toBe(1)
    })

    it('should return 404 for a filename with no matching upload document', async () => {
      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/does-not-exist.html?suffix=1`,
      )

      expect(response.status).toBe(404)
    })

    it('should allow an anonymous ordinary read but deny an anonymous dynamic-transform request', async () => {
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

    it('should allow an authenticated dynamic-transform request', async () => {
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1`,
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(`${originalPdfText}-suffix`)
    })

    it('should return 404 for a dynamic-transform request with a non-matching prefix, since prefix is resolution context', async () => {
      // Unlike the existing checkFileAccess-only path (which folds a non-matching prefix into a
      // privacy-preserving 403), resolveUploadDocument treats prefix as part of locating the
      // document itself — a non-matching prefix means no document was found at that location.
      const doc = await uploadTransformerFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1&prefix=nonexistent`,
      )

      expect(response.status).toBe(404)
    })

    it('should never persist dynamic output: the document is unchanged after a transform request', async () => {
      const doc = await uploadTransformerFixture()

      await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}?suffix=1&uppercase=1`)

      const afterRequest = await payload.findByID({
        id: doc.id,
        collection: transformerMediaSlug as CollectionSlug,
      })

      expect(afterRequest.filename).toBe(doc.filename)
    })

    it('should never persist dynamic output: no document-mutation hook fires for a transform request', async () => {
      const doc = await uploadTransformerFixture()
      resetTransformerMediaHookCallCounts()

      await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}?suffix=1&uppercase=1`)

      expect(transformerMediaHookCallCounts).toEqual({
        afterChange: 0,
        beforeChange: 0,
        beforeDelete: 0,
      })
    })

    it('should build a Payload-routed URL via generatePayloadFileURL that still enforces access control, even when the caller supplies an unrelated cloud-host url', async () => {
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

  describe('Sharp dynamic resizing', () => {
    const docIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of docIDs) {
        try {
          await payload.delete({ id, collection: resizePreviewMediaSlug as CollectionSlug })
        } catch {
          // noop — file may already have been deleted
        }
      }
      docIDs.length = 0
    })

    const uploadFixture = async (fixtureFilename: string) => {
      const filePath = path.resolve(dirname, `./${fixtureFilename}`)
      const file = await getFileByPath(filePath)
      const doc = await payload.create({
        collection: resizePreviewMediaSlug as CollectionSlug,
        data: {},
        file,
      })
      docIDs.push(doc.id)
      return doc as unknown as { filename: string; id: number | string }
    }

    it('should resize by width only, preserving aspect ratio', async () => {
      const doc = await uploadFixture('image.png') // 1600x1600

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=200`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(200)
      expect(metadata.height).toBe(200)
    })

    it('should resize by height only, preserving aspect ratio', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?height=100`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.height).toBe(100)
      expect(metadata.width).toBe(100)
    })

    it('should resize by width and height together', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=300&height=150`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(300)
      expect(metadata.height).toBe(150)
    })

    it('should return 400 for an invalid resize parameter', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=not-a-number`,
      )

      expect(response.status).toBe(400)
    })

    // A repeated `?width=` query parameter is covered at the unit level
    // (parseDynamicResize.spec.ts, handleRequest.spec.ts) — NextRESTClient's
    // qs-based query parsing collapses duplicate keys to the last value before
    // the request is ever sent, so it cannot be exercised through this client.

    it('should upscale a smaller-than-requested image by default', async () => {
      const doc = await uploadFixture('small.png') // 320x80

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=640`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(640)
    })

    it('should not upscale when withoutEnlargement=true is requested', async () => {
      const doc = await uploadFixture('small.png') // 320x80

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=640&withoutEnlargement=true`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(320)
    })

    it('should return 416 for a Range header on a recognized dynamic resize request', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?width=200`,
        {
          headers: { Range: 'bytes=0-99' },
        },
      )

      expect(response.status).toBe(416)
    })

    it('should ignore unrelated query keys and serve the original image unchanged', async () => {
      const doc = await uploadFixture('image.png')

      const response = await restClient.GET(
        `/${resizePreviewMediaSlug}/file/${doc.filename}?draft=true`,
      )

      expect(response.status).toBe(200)
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      expect(metadata.width).toBe(1600)
      expect(metadata.height).toBe(1600)
    })

    it('should never persist dynamic output: the stored file is byte-identical before and after a resize request', async () => {
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

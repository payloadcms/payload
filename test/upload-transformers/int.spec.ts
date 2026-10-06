import type { CollectionSlug, Payload, File as PayloadFile } from 'payload'

import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { getFileByPath } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'
import {
  outsideFitMediaSlug,
  resizePreviewMediaSlug,
  transformerMediaSlug,
  usersSlug,
  variantMediaSlug,
} from './shared.js'
import {
  fileRequestEvents,
  resetTransformerCallCounts,
  resetTransformerMediaHookCallCounts,
  transformerCallCounts,
  transformerMediaHookCallCounts,
} from './transformerFixtures.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const originalPdfText = fs.readFileSync(path.resolve(dirname, '../uploads/test-pdf.pdf'), 'utf-8')

let restClient: NextRESTClient
let payload: Payload

const uploadFixture = async ({
  collection = transformerMediaSlug,
  context,
  file,
  fixture = 'test-pdf.pdf',
}: {
  collection?: string
  context?: Record<string, unknown>
  file?: PayloadFile
  fixture?: string
} = {}) =>
  (await payload.create({
    collection: collection as CollectionSlug,
    context,
    data: {},
    file: file ?? (await getFileByPath(path.resolve(dirname, `../uploads/${fixture}`))),
    overrideAccess: true,
  })) as unknown as { filename: string; filesize: number; id: number | string; mimeType: string }

test.suite('Upload transformers', { config: './config.ts' }, () => {
  test.beforeEach(async ({ payload: payloadInstance, restClient: restClientInstance }) => {
    payload = payloadInstance
    restClient = restClientInstance
    resetTransformerCallCounts()

    await restClient.login({ slug: usersSlug })
  })

  test.describe('File transformers', () => {
    test.for([
      {
        name: 'the original file without a recognized query',
        expected: originalPdfText,
        query: '',
      },
      {
        name: 'a single-stage transform',
        expected: `${originalPdfText}-suffix`,
        query: 'suffix=1',
      },
      {
        name: 'every eligible stage in declaration order',
        expected: `${originalPdfText}-suffix`.toUpperCase(),
        query: 'suffix=1&uppercase=1',
      },
      {
        name: 'a transform from the full source despite a Range header',
        expected: `${originalPdfText}-suffix`,
        headers: { Range: 'bytes=0-9' },
        query: 'suffix=1',
      },
    ])('should serve $name', async ({ expected, headers, query }) => {
      const doc = await uploadFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?${query}`,
        { headers },
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(expected)
    })

    test('should return a redirect from a transformer that never touches the source', async () => {
      const doc = await uploadFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?redirect=1`,
        { redirect: 'manual' },
      )

      expect(response.status).toBe(302)
      expect(response.headers.get('Location')).toBe('https://example.com/redirected')
      expect(transformerCallCounts.redirect).toBe(1)
    })

    test('should preserve the accumulator when a stage returns continue without a replacement', async () => {
      const doc = await uploadFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1&noop=1`,
      )

      expect(response.status).toBe(200)
      expect(await response.text()).toBe(`${originalPdfText}-suffix`)
      expect(transformerCallCounts.noop).toBe(1)
    })

    test.for([
      { name: 'throws', counter: 'throwing', query: 'throwerror=1' },
      {
        name: 'consumes its source and then throws',
        counter: 'sourceConsumingError',
        query: 'sourceerror=1',
      },
      {
        name: 'consumes its source but returns no response',
        counter: 'consumeWithoutResponse',
        query: 'consumenoresponse=1',
      },
    ] as const)(
      'should abort the pipeline with 500 when a transformer $name',
      async ({ counter, query }) => {
        const doc = await uploadFixture()

        const response = await restClient.GET(
          `/${transformerMediaSlug}/file/${doc.filename}?${query}`,
        )

        expect(response.status).toBe(500)
        expect(transformerCallCounts[counter]).toBe(1)
      },
    )

    test('should return 404 for a filename with no matching upload document', async () => {
      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/does-not-exist.html?suffix=1`,
      )

      expect(response.status).toBe(404)
    })

    test('should allow an anonymous ordinary read but deny an anonymous dynamic-transform request', async () => {
      const doc = await uploadFixture()

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

    test('should return 403 for a dynamic-transform request with a non-matching prefix, matching the existing checkFileAccess-only path', async () => {
      const doc = await uploadFixture()

      const response = await restClient.GET(
        `/${transformerMediaSlug}/file/${doc.filename}?suffix=1&prefix=nonexistent`,
      )

      expect(response.status).toBe(403)
    })

    test('should never persist dynamic output: no document-mutation hook fires for a transform request', async () => {
      const doc = await uploadFixture()
      resetTransformerMediaHookCallCounts()

      await restClient.GET(`/${transformerMediaSlug}/file/${doc.filename}?suffix=1&uppercase=1`)

      expect(transformerMediaHookCallCounts).toEqual({
        afterChange: 0,
        beforeChange: 0,
        beforeDelete: 0,
      })
    })

    test.describe('read access modes', () => {
      const note: PayloadFile = {
        name: 'note.txt',
        data: Buffer.from('note'),
        mimetype: 'text/plain',
        size: 4,
      }

      test.for([
        {
          name: 'should not run canTransform when read access is denied in both modes',
          denied: ['plain', 'transform'],
          events: ['access:transform', 'access:plain'],
          query: 'suffix=1',
          status: 403,
        },
        {
          name: 'should check transform access before canTransform and transform when only it is allowed',
          denied: ['plain'],
          events: ['access:transform', 'canTransform'],
          expected: `${originalPdfText}-suffix`,
          query: 'suffix=1',
          status: 200,
        },
        {
          name: 'should serve the original when transform access is denied and no transformer applies',
          denied: ['transform'],
          events: ['access:transform', 'access:plain', 'canTransform'],
          expected: originalPdfText,
          query: '',
          status: 200,
        },
        {
          name: 'should not serve the original when only transform access is allowed and no transformer applies',
          denied: ['plain'],
          events: ['access:transform', 'canTransform', 'access:plain'],
          query: '',
          status: 403,
        },
        {
          name: 'should check only ordinary read access when no transformer matches the MIME type',
          denied: ['transform'],
          events: ['access:plain'],
          expected: 'note',
          file: note,
          query: 'suffix=1',
          status: 200,
        },
      ])('$name', async ({ denied, events, expected, file, query, status }) => {
        const doc = await uploadFixture({ file })
        const headers = Object.fromEntries(
          denied.map((accessMode) => [`x-deny-${accessMode}-read`, 'true']),
        )

        const response = await restClient.GET(
          `/${transformerMediaSlug}/file/${doc.filename}?${query}`,
          { headers },
        )

        const body = status === 200 ? await response.text() : undefined

        expect(response.status).toBe(status)
        expect(body).toBe(expected)
        expect(fileRequestEvents).toEqual(events)
      })

      test('should return 403, not 404, for a missing file when ordinary read access is denied', async () => {
        const response = await restClient.GET(
          `/${transformerMediaSlug}/file/does-not-exist.html?suffix=1`,
          { headers: { 'x-deny-plain-read': 'true' } },
        )

        expect(response.status).toBe(403)
      })
    })

    test.for([
      {
        name: 'the returned file name and type when the output bytes have no detectable type',
        expected: { filename: 'report.csv', filesize: 4, mimeType: 'text/csv' },
        output: () => new File(['a\n1\n'], 'report.csv', { type: 'text/csv' }),
      },
      {
        name: 'the detected type over a stale name and type on the returned file',
        expected: { filename: 'data.png', mimeType: 'image/png' },
        output: () =>
          new File([fs.readFileSync(path.resolve(dirname, '../uploads/small.png'))], 'data.json', {
            type: 'application/json',
          }),
      },
      {
        name: 'the upload name and type when the returned file declares neither',
        expected: { filename: 'data.json', mimeType: 'application/json' },
        output: () => new File(['{"a":2}'], ''),
      },
    ])('should store $name', async ({ expected, output }) => {
      const doc = await uploadFixture({
        context: { transformedFile: output() },
        file: {
          name: 'data.json',
          data: Buffer.from('{"a":1}'),
          mimetype: 'application/json',
          size: 7,
        },
      })

      expect(doc).toMatchObject(expected)
    })
  })

  test.describe('Sharp dynamic resizing', () => {
    test.for([
      // image.png is 1600x1600, small.png is 320x80.
      { name: 'by width only', expected: { height: 200, width: 200 }, query: 'width=200' },
      { name: 'by height only', expected: { height: 100, width: 100 }, query: 'height=100' },
      {
        name: 'by width and height together',
        expected: { height: 150, width: 300 },
        query: 'width=300&height=150',
      },
      {
        name: 'up a smaller image by default',
        expected: { width: 640 },
        fixture: 'small.png',
        query: 'width=640',
      },
      {
        name: 'without upscaling when withoutEnlargement=true is requested',
        expected: { width: 320 },
        fixture: 'small.png',
        query: 'width=640&withoutEnlargement=true',
      },
      {
        // Scale is max(100 / 320, 100 / 80) = 1.25.
        name: 'to cover the requested box when fit is outside',
        collection: outsideFitMediaSlug,
        expected: { height: 100, width: 400 },
        fixture: 'small.png',
        query: 'width=100&height=100',
      },
      {
        name: 'nothing when only unrelated query keys are present',
        expected: { height: 1600, width: 1600 },
        query: 'draft=true',
      },
    ])(
      'should resize $name',
      async ({ collection = resizePreviewMediaSlug, expected, fixture = 'image.png', query }) => {
        const doc = await uploadFixture({ collection, fixture })

        const response = await restClient.GET(`/${collection}/file/${doc.filename}?${query}`)

        expect(response.status).toBe(200)
        expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject(
          expected,
        )
      },
    )

    test('should replace the source representation headers on a resized response', async () => {
      const doc = await uploadFixture({ collection: resizePreviewMediaSlug, fixture: 'image.png' })

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

    // A repeated `?width=` query parameter is covered at the unit level
    // (parseDynamicResize.spec.ts) — NextRESTClient's
    // qs-based query parsing collapses duplicate keys to the last value before
    // the request is ever sent, so it cannot be exercised through this client.
    test.for([
      {
        name: '400 for an invalid resize parameter',
        collection: resizePreviewMediaSlug,
        query: 'width=not-a-number',
        status: 400,
      },
      {
        // The requested box is within every limit, but scale max(100 / 320, 4096 / 80) = 51.2
        // renders 16384x4096 — 4x the default maxWidth and maxPixels.
        name: '400 when fit outside would overflow the configured maximum along one axis',
        collection: outsideFitMediaSlug,
        fixture: 'small.png',
        query: 'width=100&height=4096',
        status: 400,
      },
      {
        name: '416 for a Range header on a recognized dynamic resize request',
        collection: resizePreviewMediaSlug,
        headers: { Range: 'bytes=0-99' },
        query: 'width=200',
        status: 416,
      },
    ])(
      'should return $name',
      async ({ collection, fixture = 'image.png', headers, query, status }) => {
        const doc = await uploadFixture({ collection, fixture })

        const response = await restClient.GET(`/${collection}/file/${doc.filename}?${query}`, {
          headers,
        })

        expect(response.status).toBe(status)
      },
    )

    test('should never persist dynamic output: the stored file is byte-identical before and after a resize request', async () => {
      const doc = await uploadFixture({ collection: resizePreviewMediaSlug, fixture: 'image.png' })
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

  test.describe('Multiple Sharp instances', () => {
    test('should generate variants configured on a Sharp instance registered after dynamic-only ones', async () => {
      const doc = (await uploadFixture({
        collection: variantMediaSlug,
        fixture: 'image.png',
      })) as unknown as {
        variants: { thumbnail: { filename: null | string; width: null | number } }
      }

      expect(doc.variants.thumbnail.filename).toBe('image-100x100.png')
      expect(doc.variants.thumbnail.width).toBe(100)
    })

    test('should not run an upload through Sharp instances that do not own its collection', async () => {
      await uploadFixture({ collection: variantMediaSlug, fixture: 'image.png' })

      expect(transformerCallCounts.dynamicOnlySharp).toBe(0)
    })
  })
})

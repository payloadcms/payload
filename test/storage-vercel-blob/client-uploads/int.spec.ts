import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Payload } from 'payload'

import { del, head, list, put as putWithOverwriteHeader } from '@vercel/blob'
import { getPayloadFromClientToken, put, upload } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { createServer } from 'node:http'
import path from 'path'
import * as qs from 'qs-esm'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { mediaSlug, mediaWithPrefixSlug, prefix } from '../shared.js'
import { convertedMediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

let payload: Payload
let restClient: NextRESTClient
let httpServer: Server
let handleUploadUrl: string

const serverHandlerPath = '/vercel-blob-client-upload-route'

const issueClientUpload = async ({
  collectionSlug,
  docPrefix,
  filename,
  mimeType,
}: {
  collectionSlug: string
  docPrefix?: string
  filename: string
  mimeType: string
}) =>
  restClient
    .POST(`${serverHandlerPath}?issue-client-upload=1`, {
      body: JSON.stringify({ collectionSlug, docPrefix, filename, mimeType }),
    })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to initialize client upload')
      }
      return res.json<{
        clientUploadContext: { prefix: string; signedReceipt: string }
        filename: string
        pathname: string
      }>()
    })

const getUploadInstructions = async ({ body }: { body: string }) => {
  const metadata = JSON.parse(body)
  const issued = await issueClientUpload(metadata)
  const response = await restClient.POST(serverHandlerPath, {
    body: JSON.stringify({
      type: 'blob.generate-client-token',
      payload: {
        pathname: issued.pathname,
        clientPayload: JSON.stringify({
          collectionSlug: metadata.collectionSlug,
          mimeType: metadata.mimeType,
          signedReceipt: issued.clientUploadContext.signedReceipt,
        }),
        multipart: false,
      },
    }),
  })
  const tokenResponse = await response.json()
  return {
    status: response.status,
    json: () =>
      Promise.resolve({
        data: { pathname: issued.pathname, token: tokenResponse.clientToken },
        file: {
          collectionSlug: metadata.collectionSlug,
          filename: issued.filename,
          mimeType: metadata.mimeType,
          size: metadata.filesize,
          clientUploadContext: issued.clientUploadContext,
        },
      }),
  }
}
type VercelBlobUploadInstructions = Awaited<
  ReturnType<Awaited<ReturnType<typeof getUploadInstructions>>['json']>
>

describe('@payloadcms/storage-vercel-blob clientUploads', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      await new Promise<void>((resolve) => req.on('end', resolve))

      const body = Buffer.concat(chunks).toString()
      const headers: Record<string, string> = {}
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          headers[key] = value
        }
      }

      const response = await restClient.POST(serverHandlerPath as `/${string}`, { body, headers })
      const responseBody = await response.text()

      res.writeHead(response.status, {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      })
      res.end(responseBody)
    })

    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    const port = (httpServer.address() as AddressInfo).port
    handleUploadUrl = `http://127.0.0.1:${port}`
  })

  afterAll(async () => {
    httpServer.close()
    await payload.destroy()
  })

  afterEach(async () => {
    const { blobs } = await list()
    if (blobs.length > 0) {
      await del(blobs.map((b) => b.url))
    }
  })

  it('should upload a file via client upload flow', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const issued = await issueClientUpload({
      collectionSlug: 'media',
      filename: 'image.png',
      mimeType: 'image/png',
    })

    const result = await upload(issued.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      clientPayload: JSON.stringify({
        collectionSlug: 'media',
        mimeType: 'image/png',
        signedReceipt: issued.clientUploadContext.signedReceipt,
      }),
      contentType: 'image/png',
      handleUploadUrl,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain(issued.pathname)

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === issued.pathname)
    expect(uploaded).toBeDefined()
  })

  it('should retain random suffixes for Local API uploads when client uploads are enabled', async () => {
    const doc = await payload.create({
      collection: 'media-with-prefix',
      data: {},
      filePath: path.resolve(dirname, '../../uploads/image.png'),
      overrideAccess: true,
    })
    const { blobs } = await list()

    expect(doc.filename).toMatch(/^image-[a-z0-9]+\.png$/)
    expect(blobs.map((blob) => blob.pathname)).toContain(`${prefix}/${doc.filename}`)
  })

  it('should keep main and image-size filenames separate with random suffixes', async () => {
    const doc = await payload.create({
      collection: 'media',
      data: {},
      filePath: path.resolve(dirname, '../../uploads/image.png'),
      overrideAccess: true,
    })
    const { blobs } = await list()

    expect(doc.filename).toMatch(/^image-[a-z0-9]+\.png$/)
    expect(doc.sizes?.square?.filename).toMatch(/^image-30x20-[a-z0-9]+\.png$/)
    expect(doc.url).toContain(doc.filename)
    expect(doc.sizes?.square?.url).toContain(doc.sizes?.square?.filename)
    expect(blobs.map((blob) => blob.pathname)).toContain(doc.filename)
    expect(blobs.map((blob) => blob.pathname)).toContain(doc.sizes!.square!.filename)
  })

  it('should retain random suffixes for REST multipart uploads when client uploads are enabled', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const formData = new FormData()

    formData.append('_payload', JSON.stringify({}))
    formData.append('file', new File([file], 'image.png', { type: 'image/png' }))

    const response = await restClient.POST('/media-with-prefix', { body: formData })
    const { doc } = await response.json()
    const { blobs } = await list()

    expect(response.status).toBe(201)
    expect(doc.filename).toMatch(/^image-[a-z0-9]+\.png$/)
    expect(blobs.map((blob) => blob.pathname)).toContain(`${prefix}/${doc.filename}`)
  })

  it("should reject upload when 'x-disallow-access' header is set", async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const issued = await issueClientUpload({
      collectionSlug: 'media',
      filename: 'image.png',
      mimeType: 'image/png',
    })

    await expect(
      upload(issued.pathname, new Blob([file], { type: 'image/png' }), {
        access: 'public',
        clientPayload: JSON.stringify({
          collectionSlug: 'media',
          mimeType: 'image/png',
          signedReceipt: issued.clientUploadContext.signedReceipt,
        }),
        contentType: 'image/png',
        handleUploadUrl,
        headers: { 'x-disallow-access': 'true' },
      }),
    ).rejects.toThrow()
  })

  it('should reject upload when no collection slug is provided', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

    await expect(
      upload('image.png', new Blob([file], { type: 'image/png' }), {
        access: 'public',
        handleUploadUrl,
      }),
    ).rejects.toThrow()
  })

  it('should reject legacy payloads without an issued receipt', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

    await expect(
      upload('image.png', new Blob([file], { type: 'image/png' }), {
        access: 'public',
        clientPayload: 'media',
        contentType: 'image/png',
        handleUploadUrl,
      }),
    ).rejects.toThrow()

    await expect(
      upload('legacy-image.png', new Blob([file], { type: 'image/png' }), {
        access: 'public',
        clientPayload: 'legacy-media',
        contentType: 'image/png',
        handleUploadUrl,
      }),
    ).rejects.toThrow()
  })

  it.each([
    ['SVG', 'reference.svg', 'image/svg+xml'],
    ['XML', 'reference.xml', 'application/xml'],
  ])('should keep %s files in the document upload path', async (_, filename, mimeType) => {
    await expect(
      issueClientUpload({
        collectionSlug: 'media',
        filename,
        mimeType,
      }),
    ).rejects.toThrow()
  })

  it('should upload a file with prefix via client upload flow', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const issued = await issueClientUpload({
      collectionSlug: 'media-with-prefix',
      filename: 'image.png',
      mimeType: 'image/png',
    })

    const result = await upload(issued.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      clientPayload: JSON.stringify({
        collectionSlug: 'media-with-prefix',
        mimeType: 'image/png',
        signedReceipt: issued.clientUploadContext.signedReceipt,
      }),
      contentType: 'image/png',
      handleUploadUrl,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain(prefix)
    expect(result.url).toContain('image.png')

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === issued.pathname)
    expect(uploaded).toBeDefined()
  })

  for (const { collectionSlug, format, shouldCrop } of [
    { collectionSlug: mediaWithPrefixSlug, format: 'webp', shouldCrop: false },
    { collectionSlug: mediaWithPrefixSlug, format: 'gif', shouldCrop: false },
    { collectionSlug: mediaWithPrefixSlug, format: 'tiff', shouldCrop: false },
    { collectionSlug: mediaWithPrefixSlug, format: 'png', shouldCrop: true },
    { collectionSlug: mediaSlug, format: 'png', shouldCrop: false },
    { collectionSlug: mediaSlug, format: 'png', shouldCrop: true },
    { collectionSlug: mediaWithPrefixSlug, format: 'png', shouldCrop: false },
  ] as const) {
    it(`should preserve stored bytes after saving a ${format} client upload (collection: ${collectionSlug}, crop: ${shouldCrop})`, async () => {
      const file = await sharp({
        create: { background: '#336699', channels: 3, height: 80, width: 120 },
      })
        .toFormat(format)
        .toBuffer()
      const mimeType = `image/${format}`
      const instructionsResponse = await getUploadInstructions({
        body: JSON.stringify({
          collectionSlug,
          filename: `processed.${format === 'tiff' ? 'tif' : format}`,
          filesize: file.length,
          mimeType,
        }),
      })

      expect(instructionsResponse.status).toBe(200)

      const instructions = await instructionsResponse.json()
      const uploaded = await put(instructions.data.pathname, new Blob([file], { type: mimeType }), {
        access: 'public',
        contentType: mimeType,
        token: instructions.data.token,
      })

      expect((await head(uploaded.url)).size).toBe(file.length)

      const formData = new FormData()

      formData.append('_payload', JSON.stringify({}))
      formData.append('file', JSON.stringify(instructions.file))

      const query = shouldCrop
        ? qs.stringify(
            {
              uploadEdits: {
                crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
                heightInPixels: 40,
                widthInPixels: 60,
              },
            },
            { addQueryPrefix: true },
          )
        : ''
      const response = await restClient.POST(`/${collectionSlug}${query}`, { body: formData })
      const { doc } = await response.json()

      expect(response.status).toBe(201)

      try {
        const { blobs } = await list()
        const storedDoc = await payload.findByID({
          id: doc.id,
          collection: collectionSlug,
          overrideAccess: true,
          showHiddenFields: true,
        })
        const storagePath = [storedDoc.prefix, storedDoc._objectKey, doc.filename]
          .filter(Boolean)
          .join('/')
        const stored = blobs.find((blob) => blob.pathname === storagePath)

        expect(doc.filename).toBe(instructions.file.filename)
        expect(storagePath).toBe(instructions.data.pathname)
        expect(blobs.every((blob) => blob.size > 0)).toBe(true)
        expect(
          Object.values(doc.sizes ?? {}).filter((size: { filename?: string }) => size.filename),
        ).toHaveLength(collectionSlug === mediaSlug ? 1 : 0)
        expect(stored).toBeDefined()
        expect(blobs).toHaveLength(
          1 +
            Object.values(doc.sizes ?? {}).filter((size: { filename?: string }) => size.filename)
              .length,
        )

        for (const size of Object.values(doc.sizes ?? {})) {
          if (!size.filename) {
            continue
          }
          const sizePath = [storedDoc.prefix, storedDoc._objectKey, size.filename]
            .filter(Boolean)
            .join('/')
          const storedSize = blobs.find((blob) => blob.pathname === sizePath)

          expect(storedSize).toBeDefined()
          expect(storedSize!.size).toBe(size.filesize)

          const sizeBytes = Buffer.from(await (await fetch(storedSize!.url)).arrayBuffer())

          expect(await sharp(sizeBytes).metadata()).toMatchObject({
            height: size.height,
            width: size.width,
          })
        }

        const download = await fetch(stored!.url)
        const bytes = Buffer.from(await download.arrayBuffer())

        expect(doc.filesize).toBeGreaterThan(0)
        expect(stored!.size).toBe(doc.filesize)
        expect(download.status).toBe(200)
        expect(bytes.length).toBe(doc.filesize)

        const served = await restClient.GET(doc.url.replace(/^\/api/, ''))

        expect(served.status).toBe(200)
        expect(Buffer.from(await served.arrayBuffer()).equals(bytes)).toBe(true)
        expect(await sharp(bytes).metadata()).toMatchObject({
          format,
          height: collectionSlug === mediaSlug ? 200 : shouldCrop ? 40 : 80,
          width: collectionSlug === mediaSlug ? 200 : shouldCrop ? 60 : 120,
        })
      } finally {
        await payload.delete({ id: doc.id, collection: collectionSlug, overrideAccess: true })
      }
    })
  }

  for (const scenario of ['conversion', 'mime-mismatch', 'legacy-overwrite'] as const) {
    it(`should save processed client upload bytes for ${scenario}`, async () => {
      const collectionSlug = scenario === 'conversion' ? convertedMediaSlug : mediaSlug
      const file = await sharp({
        create: { background: '#884422', channels: 3, height: 80, width: 120 },
      })
        .png()
        .toBuffer()
      const legacyDoc =
        scenario === 'legacy-overwrite'
          ? await payload.create({
              collection: mediaSlug,
              data: {},
              filePath: path.resolve(dirname, '../../uploads/image.png'),
              overrideAccess: true,
            })
          : undefined
      const submittedMime = scenario === 'mime-mismatch' ? 'image/jpeg' : 'image/png'
      const instructionsResponse = await getUploadInstructions({
        body: JSON.stringify({
          collectionSlug,
          filename: legacyDoc?.filename ?? 'processed.png',
          filesize: file.length,
          mimeType: submittedMime,
        }),
      })

      expect(instructionsResponse.status).toBe(200)

      const instructions = await instructionsResponse.json()
      expect(getPayloadFromClientToken(instructions.data.token).allowOverwrite === true).toBe(
        scenario === 'legacy-overwrite',
      )

      const body = new Blob([file], { type: submittedMime })
      const uploadOptions = {
        access: 'public' as const,
        contentType: submittedMime,
        token: instructions.data.token,
      }
      // The emulator reads overwrite from a header, whereas Vercel reads the signed client token.
      const uploaded =
        scenario === 'legacy-overwrite'
          ? await putWithOverwriteHeader(instructions.data.pathname, body, {
              ...uploadOptions,
              addRandomSuffix: false,
              allowOverwrite: true,
            })
          : await put(instructions.data.pathname, body, uploadOptions)
      const formData = new FormData()

      formData.append('_payload', JSON.stringify({}))
      formData.append('file', JSON.stringify(instructions.file))

      const query = qs.stringify(
        {
          uploadEdits: {
            crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
            heightInPixels: 40,
            widthInPixels: 60,
          },
        },
        { addQueryPrefix: true },
      )
      const response = legacyDoc
        ? await restClient.PATCH(`/${collectionSlug}/${legacyDoc.id}${query}`, { body: formData })
        : await restClient.POST(`/${collectionSlug}${query}`, { body: formData })
      const { doc } = await response.json()

      expect(response.status).toBe(legacyDoc ? 200 : 201)

      const storedDoc = await payload.findByID({
        collection: collectionSlug,
        id: doc.id,
        overrideAccess: true,
        showHiddenFields: true,
      })
      const { blobs } = await list()
      const expectedFormat = scenario === 'conversion' ? 'webp' : 'png'
      const mainPath = [storedDoc.prefix, storedDoc._objectKey, doc.filename]
        .filter(Boolean)
        .join('/')
      const main = blobs.find((blob) => blob.pathname === mainPath)

      expect(blobs).toHaveLength(2)
      expect(main).toBeDefined()
      expect(doc.mimeType).toBe(`image/${expectedFormat}`)
      expect(mainPath === instructions.data.pathname).toBe(scenario === 'mime-mismatch')
      expect(blobs.some((blob) => blob.pathname === uploaded.pathname)).toBe(
        scenario === 'mime-mismatch',
      )
      expect(doc.filename).toBe(
        scenario === 'conversion'
          ? 'processed.webp'
          : scenario === 'legacy-overwrite'
            ? instructions.file.filename.replace(/\.png$/, '-1.png')
            : instructions.file.filename,
      )
      expect(storedDoc._objectKey === undefined).toBe(scenario === 'legacy-overwrite')

      for (const storedFile of [doc, doc.sizes.square]) {
        const storagePath = [storedDoc.prefix, storedDoc._objectKey, storedFile.filename]
          .filter(Boolean)
          .join('/')
        const blob = blobs.find((blob) => blob.pathname === storagePath)
        const bytes = Buffer.from(await (await fetch(blob!.url)).arrayBuffer())
        const served = await restClient.GET(storedFile.url.replace(/^\/api/, ''))

        expect(blob!.size).toBe(storedFile.filesize)
        expect(bytes.length).toBe(storedFile.filesize)
        expect(await sharp(bytes).metadata()).toMatchObject({
          format: expectedFormat,
          height: storedFile.height,
          width: storedFile.width,
        })
        expect(served.status).toBe(200)
        expect(Buffer.from(await served.arrayBuffer()).equals(bytes)).toBe(true)
      }
    })
  }
})

import type { AddressInfo } from 'net'
import type { CollectionSlug, PayloadRequest, UploadInstructions } from 'payload'

import { randomUUID } from 'crypto'
import fs from 'fs'
import { createServer } from 'http'
import os from 'os'
import path from 'path'
import { _internal_safeFetchGlobal, createPayloadRequest, getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { expect, vitest } from 'vitest'

import type { Enlarge, Media } from './payload-types.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { checkFileRestrictions } from '../../packages/payload/src/uploads/checkFileRestrictions.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { getExternalFile } from '../../packages/payload/src/uploads/getExternalFile.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { tempFileHandler } from '../../packages/payload/src/uploads/fetchAPI-multipart/handlers.js'
import { test } from '../__helpers/int/vitest.js'
import { createStreamableFile } from './createStreamableFile.js'
import {
  adminThumbnailSizeSlug,
  allowListMediaSlug,
  anyImagesSlug,
  clientUploadTempFileSlug,
  enlargeSlug,
  focalNoSizesSlug,
  focalOnlySlug,
  mediaSlug,
  mediaWithoutWriteAccessSlug,
  noRestrictFileMimeTypesSlug,
  noRestrictFileTypesSlug,
  pdfOnlySlug,
  prefixMediaSlug,
  reduceSlug,
  relationSlug,
  restrictedMimeTypesSlug,
  restrictFileTypesSlug,
  skipAllowListSafeFetchMediaSlug,
  skipSafeFetchHeaderFilterSlug,
  skipSafeFetchMediaSlug,
  svgOnlySlug,
  unstoredMediaSlug,
  usersSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const stat = promisify(fs.stat)

test.suite({ config: './config.ts' })('Collections - Uploads', () => {
  test.beforeEach(async ({ restClient }) => {
    await restClient.login({ slug: usersSlug })
  })

  test.describe('REST API', () => {
    test.describe('create', () => {
      test('creates from upload instructions', async ({ payload, restClient }) => {
        const file = fs.readFileSync(path.join(dirname, './image.png'))
        const instructionsResponse = await restClient.POST('/upload-instructions', {
          body: JSON.stringify({
            collectionSlug: mediaSlug,
            filename: 'staged-image.png',
            filesize: file.length,
            mimeType: 'image/png',
          }),
        })
        const instructions = await instructionsResponse.json<UploadInstructions>()

        expect(instructionsResponse.status).toBe(200)
        expect(instructions.type).toBe('http')
        expect(instructions.file).toMatchObject({
          filename: 'staged-image.png',
          mimeType: 'image/png',
          size: file.length,
          uploadReference: { uploadId: expect.any(String) },
        })

        if (instructions.type !== 'http') {
          throw new Error('Expected HTTP upload instructions')
        }

        const uploadPath = new URL(instructions.request.url, restClient.serverURL).pathname.replace(
          payload.config.routes.api,
          '',
        ) as `/${string}`
        const uploadResponse = await restClient.PUT(uploadPath, {
          body: file,
          headers: instructions.request.headers,
        })

        expect(uploadResponse.status).toBe(204)

        const formData = new FormData()
        formData.append('_payload', JSON.stringify({ alt: 'Staged image' }))
        formData.append('file', JSON.stringify(instructions.file))

        const createResponse = await restClient.POST(`/${mediaSlug}`, { body: formData })
        const { doc } = await createResponse.json()

        expect(createResponse.status).toBe(201)
        expect(doc.alt).toBe('Staged image')
        expect(doc.filename).toBe('staged-image.png')
        expect(doc.width).toBeDefined()
        expect(doc.sizes.tablet.filename).toBeDefined()

        await payload.delete({ id: doc.id, collection: mediaSlug })
      })

      /**
       * The request declares one more byte than it uploads. Payload rejects the partial file so it
       * cannot be used when creating a document later.
       */
      test('rejects staged uploads smaller than the declared size', async ({
        payload,
        restClient,
      }) => {
        const file = fs.readFileSync(path.join(dirname, './image.png'))
        const instructions = await restClient
          .POST('/upload-instructions', {
            body: JSON.stringify({
              collectionSlug: mediaSlug,
              filename: 'incomplete.png',
              filesize: file.length + 1,
              mimeType: 'image/png',
            }),
          })
          .then((response) => response.json<UploadInstructions>())

        if (instructions.type !== 'http') {
          throw new Error('Expected HTTP upload instructions')
        }

        const uploadPath = new URL(instructions.request.url, restClient.serverURL).pathname.replace(
          payload.config.routes.api,
          '',
        ) as `/${string}`
        const response = await restClient.PUT(uploadPath, {
          body: file,
          headers: { 'Content-Type': 'image/png' },
        })

        expect(response.status).toBe(400)
      })

      test('rejects restricted file metadata before creating staged instructions', async ({
        restClient,
      }) => {
        const response = await restClient.POST('/upload-instructions', {
          body: JSON.stringify({
            collectionSlug: mediaSlug,
            filename: 'malware.exe',
            filesize: 2,
            mimeType: 'application/octet-stream',
          }),
        })

        expect(response.status).toBe(400)
      })

      test('rejects staged file bytes that do not match the collection MIME types', async ({
        payload,
        restClient,
      }) => {
        const executable = Buffer.alloc(64)
        executable.write('MZ')

        const instructions = await restClient
          .POST('/upload-instructions', {
            body: JSON.stringify({
              collectionSlug: pdfOnlySlug,
              filename: 'disguised.pdf',
              filesize: executable.length,
              mimeType: 'application/pdf',
            }),
          })
          .then((response) => response.json<UploadInstructions>())

        if (instructions.type !== 'http') {
          throw new Error('Expected HTTP upload instructions')
        }

        const uploadPath = new URL(instructions.request.url, restClient.serverURL).pathname.replace(
          payload.config.routes.api,
          '',
        ) as `/${string}`
        const response = await restClient.PUT(uploadPath, {
          body: executable,
          headers: instructions.request.headers,
        })

        expect(response.status).toBe(400)
      })

      test('requires authentication before staging an upload', async ({ restClient }) => {
        const response = await restClient.POST('/upload-instructions', {
          auth: false,
          body: JSON.stringify({
            collectionSlug: mediaSlug,
            filename: 'unauthorized.png',
            filesize: 1,
            mimeType: 'image/png',
          }),
        })

        expect(response.status).toBe(403)
      })

      test('requires create or update permission before staging an upload', async ({
        restClient,
      }) => {
        const response = await restClient.POST('/upload-instructions', {
          body: JSON.stringify({
            collectionSlug: mediaWithoutWriteAccessSlug,
            filename: 'forbidden.png',
            filesize: 1,
            mimeType: 'image/png',
          }),
        })

        expect(response.status).toBe(403)
      })

      test('rejects a file payload missing an upload reference with a 400', async ({
        restClient,
      }) => {
        const formData = new FormData()
        formData.append('_payload', JSON.stringify({ alt: 'Missing reference' }))
        formData.append('file', JSON.stringify({ filename: 'no-reference.png' }))

        const response = await restClient.POST(`/${mediaSlug}`, { body: formData })

        expect(response.status).toBe(400)
      })

      test('creates from form data given a png', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './image.png')
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/${mediaSlug}`, {
          body: formData,
          file,
        })
        const { doc } = await response.json()

        await handle.close()

        expect(response.status).toBe(201)

        const { sizes } = doc
        const expectedPath = path.join(dirname, './media')

        // Check for files
        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)
        expect(
          await fileExists(path.join(expectedPath, sizes.maintainedAspectRatio.filename)),
        ).toBe(true)
        expect(await fileExists(path.join(expectedPath, sizes.tablet.filename))).toBe(true)
        expect(await fileExists(path.join(expectedPath, sizes.mobile.filename))).toBe(true)
        expect(await fileExists(path.join(expectedPath, sizes.icon.filename))).toBe(true)

        // Check api response
        expect(doc.mimeType).toEqual('image/png')
        expect(doc.focalX).toEqual(50)
        expect(doc.focalY).toEqual(50)
        expect(sizes.maintainedAspectRatio.url).toContain('/api/media/file/image')
        expect(sizes.maintainedAspectRatio.url).toContain('.png')
        expect(sizes.maintainedAspectRatio.width).toEqual(1024)
        expect(sizes.maintainedAspectRatio.height).toEqual(1024)
        expect(sizes).toHaveProperty('tablet')
        expect(sizes).toHaveProperty('mobile')
        expect(sizes).toHaveProperty('icon')
      })

      test('should URL encode filenames with spaces in both main url and size urls', async ({
        payload,
      }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        file!.name = 'my test image.png'

        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        expect(mediaDoc.url).toBeDefined()
        expect(mediaDoc.url).toContain('%20')
        expect(mediaDoc.url).not.toContain(' ')

        // Check that size URLs are also properly encoded
        expect(mediaDoc.sizes?.tablet?.url).toBeDefined()
        expect(mediaDoc.sizes?.tablet?.url).toContain('%20')
        expect(mediaDoc.sizes?.tablet?.url).not.toContain(' ')

        expect(mediaDoc.sizes?.icon?.url).toBeDefined()
        expect(mediaDoc.sizes?.icon?.url).toContain('%20')
        expect(mediaDoc.sizes?.icon?.url).not.toContain(' ')

        await payload.delete({ collection: mediaSlug, id: mediaDoc.id })
      })

      test('creates from form data given an svg', async ({ restClient }) => {
        const filePath = path.join(dirname, './image.svg')
        const formData = new FormData()
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/${mediaSlug}`, {
          body: formData,
          file,
        })

        const { doc } = await response.json()

        await handle.close()

        expect(response.status).toBe(201)

        // Check for files
        expect(await fileExists(path.join(dirname, './media', doc.filename))).toBe(true)

        // Check api response
        expect(doc.mimeType).toEqual('image/svg+xml')
        expect(doc.sizes.maintainedAspectRatio.url).toBeFalsy()
        expect(doc.width).toBeDefined()
        expect(doc.height).toBeDefined()
      })

      test('should upload svg in an image mimetype restricted collection', async ({
        restClient,
      }) => {
        const filePath = path.join(dirname, './image.svg')
        const formData = new FormData()
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/any-images`, {
          body: formData,
          file,
        })

        const { doc } = await response.json()
        await handle.close()

        expect(response.status).toBe(201)
        expect(doc.mimeType).toEqual('image/svg+xml')
      })

      test('should have valid image url', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './image.svg')
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/${mediaSlug}`, {
          body: formData,
          file,
        })
        const { doc } = await response.json()

        await handle.close()

        expect(response.status).toBe(201)
        const expectedPath = path.join(dirname, './media')
        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)

        expect(doc.url).not.toContain('undefined')
      })

      test('creates images that do not require all sizes', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './small.png')
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/${mediaSlug}`, {
          body: formData,
          file,
        })
        const { doc } = await response.json()

        await handle.close()

        expect(response.status).toBe(201)

        const expectedPath = path.join(dirname, './media')

        // Check for files
        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)
        expect(await fileExists(path.join(expectedPath, 'small-640x480.png'))).toBe(false)
        expect(await fileExists(path.join(expectedPath, doc.sizes.icon.filename))).toBe(true)

        // Check api response
        expect(doc.sizes.tablet.filename).toBeNull()
        expect(doc.sizes.icon.filename).toBeDefined()
      })

      test('should not set url on image sizes that cannot be generated', async ({
        payload,
        restClient,
      }) => {
        // Create image too small for size generation
        const formData = new FormData()
        const filePath = path.join(dirname, './small.png')
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/${mediaSlug}`, {
          body: formData,
          file,
        })
        const { doc } = await response.json()

        await handle.close()

        expect(response.status).toBe(201)

        // Check ungenerated sizes are empty, including the URL
        expect(doc.sizes.tablet.filename).toBeNull()
        expect(doc.sizes.tablet.width).toBeNull()
        expect(doc.sizes.tablet.height).toBeNull()
        expect(doc.sizes.tablet.mimeType).toBeNull()
        expect(doc.sizes.tablet.filesize).toBeNull()
        expect(doc.sizes.tablet.url).toBeNull()

        // Also verify the database
        const dbDoc = await payload.db.findOne({
          collection: mediaSlug,
          where: { id: { equals: doc.id } },
        })

        expect(dbDoc.sizes.tablet.url).toBeNull()
      })

      test('creates images from a different format', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './image.jpg')
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/${mediaSlug}`, {
          body: formData,
          file,
        })
        const { doc } = await response.json()

        await handle.close()

        expect(response.status).toBe(201)

        const expectedPath = path.join(dirname, './media')

        // Check for files
        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)
        expect(await fileExists(path.join(expectedPath, doc.sizes.tablet.filename))).toBe(true)

        // Check api response
        expect(doc.filename).toContain('.png')
        expect(doc.mimeType).toEqual('image/png')
        expect(doc.sizes.maintainedAspectRatio.filename).toContain('.png')
        expect(doc.sizes.maintainedAspectRatio.mimeType).toContain('image/png')
        expect(doc.sizes.differentFormatFromMainImage.filename).toContain('.jpg')
        expect(doc.sizes.differentFormatFromMainImage.mimeType).toContain('image/jpeg')
      })

      test('creates media without storing a file', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './unstored.png')
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        // unstored media
        const response = await restClient.POST(`/${unstoredMediaSlug}`, {
          body: formData,
          file,
        })
        const { doc } = await response.json()

        await handle.close()

        expect(response.status).toBe(201)

        // Check for files
        expect(await fileExists(path.join(dirname, './media', doc.filename))).toBe(false)

        // Check api response
        expect(doc.filename).toBeDefined()
      })

      test('should not allow creation of corrupted PDF', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './fake-pdf.pdf')
        const { file, handle } = await createStreamableFile(filePath, 'application/pdf')
        formData.append('file', file)

        const response = await restClient.POST(`/${pdfOnlySlug}`, {
          body: formData,
        })
        await handle.close()

        expect(response.status).toBe(400)
      })

      test('should not allow html file to be uploaded to PDF only collection', async ({
        restClient,
      }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './test.html')
        const { file, handle } = await createStreamableFile(filePath, 'application/pdf')
        formData.append('file', file)
        formData.append('contentType', 'application/pdf')

        const response = await restClient.POST(`/${pdfOnlySlug}`, {
          body: formData,
        })
        await handle.close()

        expect(response.status).toBe(400)
      })

      test('should not allow invalid mimeType to be created', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './image.jpg')
        const { file, handle } = await createStreamableFile(filePath, 'image/png')
        formData.append('file', file)
        formData.append('mime', 'image/png')
        formData.append('contentType', 'image/png')

        const response = await restClient.POST(`/${restrictedMimeTypesSlug}`, {
          body: formData,
        })
        await handle.close()

        expect(response.status).toBe(400)
      })

      test('should not allow corrupted SVG to be created', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './corrupt.svg')
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const response = await restClient.POST(`/${svgOnlySlug}`, {
          body: formData,
        })
        await handle.close()

        expect(response.status).toBe(400)
      })
    })
    test.describe('update', () => {
      test('should replace image and delete old files - by ID', async ({ payload, restClient }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        file.name = 'renamed.png'

        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        const formData = new FormData()
        const filePath2 = path.resolve(dirname, './small.png')
        const { file: file2, handle } = await createStreamableFile(filePath2)
        formData.append('file', file2)

        const response = await restClient.PATCH(`/${mediaSlug}/${mediaDoc.id}`, {
          body: formData,
          file: file2,
        })

        await handle.close()

        expect(response.status).toBe(200)

        const expectedPath = path.join(dirname, './media')

        // Check that previously existing files were removed
        expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(false)
        expect(await fileExists(path.join(expectedPath, mediaDoc.sizes.icon.filename))).toBe(false)
      })

      test('should replace image and delete old files - where query', async ({
        payload,
        restClient,
      }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        file.name = 'renamed.png'

        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        const formData = new FormData()
        const filePath2 = path.resolve(dirname, './small.png')
        const { file: file2, handle } = await createStreamableFile(filePath2)
        formData.append('file', file2)

        const response = await restClient.PATCH(`/${mediaSlug}`, {
          body: formData,
          file: file2,
          query: {
            where: {
              id: {
                equals: mediaDoc.id,
              },
            },
          },
        })

        await handle.close()

        expect(response.status).toBe(200)

        const expectedPath = path.join(dirname, './media')

        // Check that previously existing files were removed
        expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(false)
        expect(await fileExists(path.join(expectedPath, mediaDoc.sizes.icon.filename))).toBe(false)
      })
    })
    test.describe('delete', () => {
      test('should remove related files when deleting by ID', async ({ restClient }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './image.png')
        const { file, handle } = await createStreamableFile(filePath)

        formData.append('file', file)

        const { doc } = await restClient
          .POST(`/${mediaSlug}`, {
            body: formData,
            file,
          })
          .then((res) => res.json())

        await handle.close()

        const response2 = await restClient.DELETE(`/${mediaSlug}/${doc.id}`)
        expect(response2.status).toBe(200)

        expect(await fileExists(path.join(dirname, doc.filename))).toBe(false)
      })

      test('should remove all related files when deleting with where query', async ({
        restClient,
      }) => {
        const formData = new FormData()
        const filePath = path.join(dirname, './image.png')
        const { file, handle } = await createStreamableFile(filePath)
        formData.append('file', file)

        const { doc } = await restClient
          .POST(`/${mediaSlug}`, {
            body: formData,
            file,
          })
          .then((res) => res.json())

        await handle.close()

        const { errors } = await restClient
          .DELETE(`/${mediaSlug}`, {
            query: {
              where: {
                id: {
                  equals: doc.id,
                },
              },
            },
          })
          .then((res) => res.json())

        expect(errors).toHaveLength(0)

        expect(await fileExists(path.join(dirname, doc.filename))).toBe(false)
      })
    })
    test.describe('read', () => {
      test('should serve files with hash characters in filename', async ({
        payload,
        restClient,
      }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        file!.name = 'file #hash.png'

        const mediaDoc = await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })

        expect(mediaDoc.url).toContain('%23')
        expect(mediaDoc.url).not.toContain('#')

        expect(mediaDoc.filename).toContain('#')
        expect(mediaDoc.filename).not.toContain('%23')

        const response = await restClient.GET(`/${mediaSlug}/file/${mediaDoc.filename}`)

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain('image/png')

        await payload.delete({ collection: mediaSlug, id: mediaDoc.id })
      })

      test('should return the media document with the correct file type', async ({
        payload,
        restClient,
      }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        file.name = 'renamed.png'

        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        const response = await restClient.GET(`/${mediaSlug}/file/${mediaDoc.filename}`)

        expect(response.status).toBe(200)

        expect(response.headers.get('content-type')).toContain('image/png')

        await payload.delete({ collection: mediaSlug, id: mediaDoc.id })
      })
    })
  })

  test.describe('Local API', () => {
    test.describe('create', () => {
      test('should create documents when passing filePath', async ({ payload }) => {
        const expectedPath = path.join(dirname, './svg-only')

        const svgFilePath = path.resolve(dirname, './svgWithXml.svg')
        const doc = await payload.create({
          collection: svgOnlySlug as CollectionSlug,
          data: {},
          filePath: svgFilePath,
        })

        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)
      })

      test('should create documents when passing file', async ({ payload }) => {
        const expectedPath = path.join(dirname, './with-any-image-type')

        const svgFilePath = path.resolve(dirname, './svgWithXml.svg')
        const fileBuffer = fs.readFileSync(svgFilePath)
        const doc = await payload.create({
          collection: anyImagesSlug as CollectionSlug,
          data: {},
          file: {
            data: fileBuffer,
            mimetype: 'image/svg+xml',
            name: 'svgWithXml.svg',
            size: fileBuffer.length,
          },
        })

        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)

        await payload.delete({ collection: anyImagesSlug as CollectionSlug, id: doc.id })
      })

      test('should create documents for JPEG XL files, which sharp cannot decode', async ({
        payload,
      }) => {
        const expectedPath = path.join(dirname, './with-any-image-type')

        // `canResizeImage` already excludes `image/jxl` from any resize or
        // sharp decode attempt, so only the header needs to be readable
        const jxlFilePath = path.resolve(dirname, './test-image.jxl')
        const fileBuffer = fs.readFileSync(jxlFilePath)
        const doc = await payload.create({
          collection: anyImagesSlug as CollectionSlug,
          data: {},
          file: {
            data: fileBuffer,
            mimetype: 'image/jxl',
            name: 'test-image.jxl',
            size: fileBuffer.length,
          },
        })

        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)
        expect(doc.mimeType).toEqual('image/jxl')
        expect(doc.width).toEqual(800)
        expect(doc.height).toEqual(800)

        await payload.delete({ collection: anyImagesSlug as CollectionSlug, id: doc.id })
      })

      test('should upload svg files', async ({ payload }) => {
        const expectedPath = path.join(dirname, './with-any-image-type')

        const svgFilePath = path.resolve(dirname, './svgWithXml.svg')
        const doc = await payload.create({
          collection: anyImagesSlug as CollectionSlug,
          data: {},
          filePath: svgFilePath,
        })
        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)
        expect(doc.mimeType).toEqual('image/svg+xml')
      })

      test('should not crash when adminThumbnail size is not generated', async ({ payload }) => {
        const svgFilePath = path.resolve(dirname, './svgWithXml.svg')
        const fileBuffer = fs.readFileSync(svgFilePath)

        // SVGs cannot be resized, so sizes.small should have null fields
        const doc = await payload.create({
          collection: adminThumbnailSizeSlug as CollectionSlug,
          data: {},
          file: {
            data: fileBuffer,
            mimetype: 'image/svg+xml',
            name: 'test-thumbnail.svg',
            size: fileBuffer.length,
          },
        })

        expect(doc.id).toBeDefined()
        expect(doc.filename).toBeDefined()
        expect(doc.thumbnailURL).toBeNull()

        // Clean up
        await payload.delete({
          collection: adminThumbnailSizeSlug as CollectionSlug,
          id: doc.id,
        })
      })
    })

    test.describe('update', () => {
      test('should remove existing media on re-upload - by ID', async ({ payload }) => {
        // Create temp file
        const filePath = path.resolve(dirname, './temp.png')
        const file = await getFileByPath(filePath)
        file.name = 'temp.png'

        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        const expectedPath = path.join(dirname, './media')

        // Check that the temp file was created
        expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(true)

        // Replace the temp file with a new one
        const newFilePath = path.resolve(dirname, './temp-renamed.png')
        const newFile = await getFileByPath(newFilePath)
        newFile.name = 'temp-renamed.png'

        const updatedMediaDoc = (await payload.update({
          collection: mediaSlug,
          id: mediaDoc.id,
          file: newFile,
          data: {},
        })) as unknown as Media

        // Check that the replacement file was created and the old one was removed
        expect(await fileExists(path.join(expectedPath, updatedMediaDoc.filename))).toBe(true)
        expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(false)

        await payload.delete({ collection: mediaSlug, id: updatedMediaDoc.id })
      })

      test('should remove existing media on re-upload - where query', async ({ payload }) => {
        // Create temp file
        const filePath = path.resolve(dirname, './temp.png')
        const file = await getFileByPath(filePath)
        file.name = 'temp.png'

        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        const expectedPath = path.join(dirname, './media')

        // Check that the temp file was created
        expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(true)

        // Replace the temp file with a new one
        const newFilePath = path.resolve(dirname, './temp-renamed.png')
        const newFile = await getFileByPath(newFilePath)
        newFile.name = 'temp-renamed-second.png'

        const updatedMediaDoc = (await payload.update({
          collection: mediaSlug,
          where: {
            id: { equals: mediaDoc.id },
          },
          file: newFile,
          data: {},
        })) as unknown as { docs: Media[] }

        // Check that the replacement file was created and the old one was removed
        expect(updatedMediaDoc.docs[0].filename).toEqual(newFile.name)
        expect(await fileExists(path.join(expectedPath, updatedMediaDoc.docs[0].filename))).toBe(
          true,
        )
        expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(false)

        await payload.delete({ collection: mediaSlug, id: updatedMediaDoc.docs[0].id })
      })

      test('should remove sizes that do not pertain to the new image - by ID', async ({
        payload,
      }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        const small = await getFileByPath(path.resolve(dirname, './small.png'))

        const { id } = await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })

        const doc = (await payload.update({
          collection: mediaSlug,
          id,
          data: {},
          file: small,
        })) as unknown as Media

        expect(doc.sizes.icon).toBeDefined()
        expect(doc.sizes.tablet.width).toBeNull()
      })

      test('should remove sizes that do not pertain to the new image - where query', async ({
        payload,
      }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        const small = await getFileByPath(path.resolve(dirname, './small.png'))

        const { id } = await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })

        const doc = (await payload.update({
          collection: mediaSlug,
          where: {
            id: { equals: id },
          },
          data: {},
          file: small,
        })) as unknown as { docs: Media[] }

        expect(doc.docs[0].sizes.icon).toBeDefined()
        expect(doc.docs[0].sizes.tablet.width).toBeNull()
      })

      test('should allow removing file from upload relationship field - by ID', async ({
        payload,
      }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        file.name = 'renamed.png'

        const { id } = await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })

        const related = await payload.create({
          collection: relationSlug,
          data: {
            image: id,
          },
        })

        const doc = await payload.update({
          collection: relationSlug,
          id: related.id,
          data: {
            image: null,
          },
        })

        expect(doc.image).toBeFalsy()
      })

      test('should allow update removing a relationship - where query', async ({ payload }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        file.name = 'renamed.png'

        const { id } = await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })

        const related = await payload.create({
          collection: relationSlug,
          data: {
            image: id,
          },
        })

        const doc = await payload.update({
          collection: relationSlug,
          where: {
            id: { equals: related.id },
          },
          data: {
            image: null,
          },
        })

        expect(doc.docs[0].image).toBeFalsy()
      })

      test('should allow a localized upload relationship in a block', async ({ payload }) => {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)

        const { id } = await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })

        const { id: id_2 } = await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })

        const res = await payload.create({
          collection: 'relation',
          depth: 0,
          data: {
            blocks: [
              {
                blockType: 'localizedMediaBlock',
                media: id,
                relatedMedia: [id],
              },
            ],
          },
        })

        expect(res.blocks[0]?.media).toBe(id)
        expect(res.blocks[0]?.relatedMedia).toEqual([id])

        const res_2 = await payload.update({
          collection: 'relation',
          id: res.id,
          depth: 0,
          data: {
            blocks: [
              {
                id: res.blocks[0]?.id,
                blockType: 'localizedMediaBlock',
                media: id_2,
                relatedMedia: [id_2],
              },
            ],
          },
        })

        expect(res_2.blocks[0]?.media).toBe(id_2)
        expect(res_2.blocks[0]?.relatedMedia).toEqual([id_2])
      })
    })

    test.describe('cookie filtering', () => {
      test('should filter out payload cookies when externalFileHeaderFilter is not defined', async ({
        payload,
      }) => {
        const testCookies = ['payload-token=123', 'other-cookie=456', 'payload-something=789'].join(
          '; ',
        )

        const fetchSpy = vitest.spyOn(global, 'fetch')

        await payload.create({
          collection: skipSafeFetchMediaSlug,
          data: {
            filename: 'fat-head-nate.png',
            url: 'https://www.payload.marketing/fat-head-nate.png',
          },
          req: {
            headers: new Headers({
              cookie: testCookies,
            }),
          },
        })

        const [[, options]] = fetchSpy.mock.calls
        const cookieHeader = options.headers.cookie

        expect(cookieHeader).not.toContain('payload-token=123')
        expect(cookieHeader).not.toContain('payload-something=789')
        expect(cookieHeader).toContain('other-cookie=456')

        fetchSpy.mockRestore()
      })

      test('getExternalFile should not filter out payload cookies when externalFileHeaderFilter is not defined and the URL is not external', async ({
        payload,
      }) => {
        const testCookies = ['payload-token=123', 'other-cookie=456', 'payload-something=789'].join(
          '; ',
        )

        const fetchSpy = vitest.spyOn(global, 'fetch')

        // spin up a temporary server so fetch to the local doesn't fail
        const server = createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        })
        await new Promise((res) => server.listen(0, undefined, undefined, res))

        const port = (server.address() as AddressInfo).port
        const baseUrl = `http://localhost:${port}`

        const req = await createPayloadRequest({
          config: payload.config,
          request: new Request(baseUrl, {
            headers: new Headers({
              cookie: testCookies,
              origin: baseUrl,
            }),
          }),
        })

        await getExternalFile({
          data: { url: '/api/media/image.png' },
          req,
          uploadConfig: { skipSafeFetch: true },
        })

        const [[, options]] = fetchSpy.mock.calls
        const cookieHeader = options.headers.cookie

        expect(cookieHeader).toContain('payload-token=123')
        expect(cookieHeader).toContain('payload-something=789')
        expect(cookieHeader).toContain('other-cookie=456')

        fetchSpy.mockRestore()
        await new Promise((res) => server.close(res))
      })

      test('should keep all cookies when externalFileHeaderFilter is defined', async ({
        payload,
      }) => {
        const testCookies = ['payload-token=123', 'other-cookie=456', 'payload-something=789'].join(
          '; ',
        )

        const fetchSpy = vitest.spyOn(global, 'fetch')

        await payload.create({
          collection: skipSafeFetchHeaderFilterSlug,
          data: {
            filename: 'fat-head-nate.png',
            url: 'https://www.payload.marketing/fat-head-nate.png',
          },
          req: {
            headers: new Headers({
              cookie: testCookies,
            }),
          },
        })

        const [[, options]] = fetchSpy.mock.calls
        const cookieHeader = options.headers.cookie

        expect(cookieHeader).toContain('other-cookie=456')
        expect(cookieHeader).toContain('payload-token=123')
        expect(cookieHeader).toContain('payload-something=789')

        fetchSpy.mockRestore()
      })
    })

    test.describe('filters', () => {
      test.for([
        { url: 'http://127.0.0.1/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        { url: 'http://[::1]/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        { url: 'http://10.0.0.1/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        { url: 'http://192.168.1.1/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        { url: 'http://172.16.0.1/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        { url: 'http://169.254.1.1/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        { url: 'http://224.0.0.1/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        { url: 'http://0.0.0.0/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        { url: 'http://255.255.255.255/file.png', collection: mediaSlug, errorContains: 'unsafe' },
        {
          url: 'http://127.0.0.1/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
        {
          url: 'http://[::1]/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
        {
          url: 'http://10.0.0.1/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
        {
          url: 'http://192.168.1.1/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
        {
          url: 'http://172.16.0.1/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
        {
          url: 'http://169.254.1.1/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
        {
          url: 'http://224.0.0.1/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
        {
          url: 'http://0.0.0.0/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
        {
          url: 'http://255.255.255.255/file.png',
          collection: allowListMediaSlug,
          errorContains: 'There was a problem while uploading the file.',
        },
      ])(
        'should block or filter uploading from $collection with URL: $url',
        async ({ url, collection, errorContains }, { payload }) => {
          const globalCachedFn = _internal_safeFetchGlobal.lookup

          let hostname = new URL(url).hostname

          const isIPV6 = hostname.includes('::')

          // Strip brackets from IPv6 addresses
          if (isIPV6) {
            hostname = hostname.slice(1, -1)
          }

          // Here we're essentially mocking our own DNS provider, to get 'https://www.payloadcms.com/test.png' to resolve to the IP
          // we'd like to test for
          // @ts-expect-error this does not need to be mocked 100% correctly
          _internal_safeFetchGlobal.lookup = (_hostname, _options, callback) => {
            callback(null, hostname as any, isIPV6 ? 6 : 4)
          }

          await expect(
            payload.create({
              collection,
              data: {
                filename: 'test.png',
                // Need to pass a domain for lookup to be called. We monkey patch the IP lookup function above
                // to return the IP address we want to test.
                url: 'https://www.payloadcms.com/test.png',
              },
            }),
          ).rejects.toThrow(
            expect.objectContaining({
              name: 'FileRetrievalError',
              message: expect.stringContaining(errorContains),
            }),
          )

          _internal_safeFetchGlobal.lookup = globalCachedFn

          // Now ensure this throws if we pass the IP address directly, without the mock
          const directURLFailure =
            collection === allowListMediaSlug
              ? {
                  message: expect.not.stringContaining('unsafe'),
                }
              : {
                  message: expect.stringContaining(errorContains),
                  name: 'FileRetrievalError',
                }

          await expect(
            payload.create({
              collection,
              data: {
                filename: 'test.png',
                url,
              },
            }),
          ).rejects.toThrow(expect.objectContaining(directURLFailure))
        },
      )
      test('should fetch when skipSafeFetch is set with a boolean', async ({ payload }) => {
        await expect(
          payload.create({
            collection: skipSafeFetchMediaSlug as CollectionSlug,
            data: {
              filename: 'test.png',
              url: 'http://127.0.0.1/file.png',
            },
          }),
          // We're expecting this to throw because the file doesn't exist -- not because the url is unsafe
        ).rejects.toThrow(
          expect.objectContaining({
            name: 'FileRetrievalError',
            message: expect.not.stringContaining('unsafe'),
          }),
        )
      })

      test('should fetch when skipSafeFetch is set with an AllowList', async ({ payload }) => {
        await expect(
          payload.create({
            collection: skipAllowListSafeFetchMediaSlug as CollectionSlug,
            data: {
              filename: 'test.png',
              url: 'http://127.0.0.1/file.png',
            },
          }),
          // We're expecting this to throw because the file doesn't exist -- not because the url is unsafe
        ).rejects.toThrow(
          expect.objectContaining({
            name: 'FileRetrievalError',
            message: expect.not.stringContaining('unsafe'),
          }),
        )
      })
    })

    test.describe('file restrictions', () => {
      const file: File = {
        name: `test-${randomUUID()}.html`,
        data: Buffer.from('<html><script>alert("test")</script></html>'),
        mimetype: 'text/html',
        size: 100,
      }
      test('should not allow files with restricted file types', async ({ payload }) => {
        await expect(async () =>
          payload.create({
            collection: restrictFileTypesSlug as CollectionSlug,
            data: {},
            file,
          }),
        ).rejects.toThrow(
          expect.objectContaining({
            name: 'ValidationError',
            message: `The following field is invalid: file`,
          }),
        )
      })

      test('should allow files with restricted file types when allowRestrictedFileTypes is true', async ({
        payload,
      }) => {
        await expect(
          payload.create({
            collection: noRestrictFileTypesSlug as CollectionSlug,
            data: {},
            file,
          }),
        ).resolves.not.toThrow()
      })

      test('should allow files with restricted file types when mimeTypes are set', async ({
        payload,
      }) => {
        await expect(
          payload.create({
            collection: noRestrictFileMimeTypesSlug as CollectionSlug,
            data: {},
            file,
          }),
        ).resolves.not.toThrow()
      })

      test.describe('useTempFiles MIME type bypass', () => {
        const createdTmpFiles: string[] = []

        const mockReq = {
          payload: {
            config: { upload: { useTempFiles: true } },
            logger: { warn: () => {}, error: () => {} },
          },
        } as unknown as PayloadRequest

        test.afterEach(async () => {
          for (const tmpFile of createdTmpFiles) {
            try {
              await fs.promises.unlink(tmpFile)
            } catch {
              // ignore cleanup errors
            }
          }
          createdTmpFiles.length = 0
        })

        test('should not bypass mimeTypes restriction when useTempFiles is enabled and file is HTML', async () => {
          const htmlContent = Buffer.from('<html><script>alert("xss")</script></html>')
          const tmpFile = path.join(os.tmpdir(), `payload-test-${randomUUID()}.html`)
          createdTmpFiles.push(tmpFile)
          await fs.promises.writeFile(tmpFile, htmlContent)

          await expect(
            checkFileRestrictions({
              collection: {
                slug: 'test',
                upload: { mimeTypes: ['image/*'], staticDir: '/tmp' },
              } as any,
              file: {
                data: Buffer.alloc(0),
                mimetype: 'text/html',
                name: 'malicious.html',
                size: htmlContent.length,
                tempFilePath: tmpFile,
              },
              req: mockReq,
            }),
          ).rejects.toMatchObject({ name: 'ValidationError' })
        })

        test('should not bypass SVG content validation when useTempFiles is enabled', async () => {
          const svgContent = Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>',
          )
          const tmpFile = path.join(os.tmpdir(), `payload-test-${randomUUID()}.svg`)
          createdTmpFiles.push(tmpFile)
          await fs.promises.writeFile(tmpFile, svgContent)

          await expect(
            checkFileRestrictions({
              collection: {
                slug: 'test',
                upload: { mimeTypes: ['image/svg+xml', 'image/*'], staticDir: '/tmp' },
              } as any,
              file: {
                data: Buffer.alloc(0),
                mimetype: 'image/svg+xml',
                name: 'malicious.svg',
                size: svgContent.length,
                tempFilePath: tmpFile,
              },
              req: mockReq,
            }),
          ).rejects.toMatchObject({ name: 'ValidationError' })
        })

        test('should allow a valid image file when useTempFiles is enabled', async () => {
          const pngData = await fs.promises.readFile(path.resolve(dirname, './image.png'))
          const tmpFile = path.join(os.tmpdir(), `payload-test-${randomUUID()}.png`)
          createdTmpFiles.push(tmpFile)
          await fs.promises.writeFile(tmpFile, pngData)

          await expect(
            checkFileRestrictions({
              collection: {
                slug: 'test',
                upload: { mimeTypes: ['image/*'], staticDir: '/tmp' },
              } as any,
              file: {
                data: Buffer.alloc(0),
                mimetype: 'image/png',
                name: 'valid.png',
                size: pngData.length,
                tempFilePath: tmpFile,
              },
              req: mockReq,
            }),
          ).resolves.not.toThrow()
        })

        test('should throw ValidationError when tempFilePath is missing and file.data is empty', async () => {
          // No tempFilePath — falls through to extension-based check, which should still reject
          await expect(
            checkFileRestrictions({
              collection: {
                slug: 'test',
                upload: { mimeTypes: ['image/*'], staticDir: '/tmp' },
              } as any,
              file: {
                data: Buffer.alloc(0),
                mimetype: 'text/html',
                name: 'malicious.html',
                size: 0,
              },
              req: mockReq,
            }),
          ).rejects.toMatchObject({ name: 'ValidationError' })
        })

        test('should reject an invalid PDF when useTempFiles is enabled', async () => {
          const invalidPdfContent = Buffer.from('not a pdf')
          const tmpFile = path.join(os.tmpdir(), `payload-test-${randomUUID()}.pdf`)
          createdTmpFiles.push(tmpFile)
          await fs.promises.writeFile(tmpFile, invalidPdfContent)

          await expect(
            checkFileRestrictions({
              collection: {
                slug: 'test',
                upload: { mimeTypes: ['application/pdf'], staticDir: '/tmp' },
              } as any,
              file: {
                data: Buffer.alloc(0),
                mimetype: 'application/pdf',
                name: 'invalid.pdf',
                size: invalidPdfContent.length,
                tempFilePath: tmpFile,
              },
              req: mockReq,
            }),
          ).rejects.toMatchObject({ name: 'ValidationError' })
        })
      })
    })
  })

  test.describe('focal point', () => {
    let file

    test.beforeAll(async () => {
      // Create image
      const filePath = path.resolve(dirname, './image.png')
      file = await getFileByPath(filePath)
      file.name = 'focal.png'
    })

    test('should be able to set focal point through local API', async ({ payload }) => {
      const doc = await payload.create({
        collection: focalOnlySlug,
        data: {
          focalX: 5,
          focalY: 5,
        },
        file,
      })

      expect(doc.focalX).toEqual(5)
      expect(doc.focalY).toEqual(5)

      const updatedFocal = await payload.update({
        collection: focalOnlySlug,
        id: doc.id,
        data: {
          focalX: 10,
          focalY: 10,
        },
      })

      expect(updatedFocal.focalX).toEqual(10)
      expect(updatedFocal.focalY).toEqual(10)

      const updateWithoutFocal = await payload.update({
        collection: focalOnlySlug,
        id: doc.id,
        data: {},
      })

      // Expect focal point to be the same
      expect(updateWithoutFocal.focalX).toEqual(10)
      expect(updateWithoutFocal.focalY).toEqual(10)

      await payload.delete({ collection: focalOnlySlug, id: doc.id })
    })

    test('should default focal point to 50, 50', async ({ payload }) => {
      const doc = await payload.create({
        collection: focalOnlySlug,
        data: {
          // No focal point
        },
        file,
      })

      expect(doc.focalX).toEqual(50)
      expect(doc.focalY).toEqual(50)

      const updateWithoutFocal = await payload.update({
        collection: focalOnlySlug,
        id: doc.id,
        data: {},
      })

      expect(updateWithoutFocal.focalX).toEqual(50)
      expect(updateWithoutFocal.focalY).toEqual(50)

      await payload.delete({ collection: focalOnlySlug, id: doc.id })
    })

    test('should set focal point even if no sizes defined', async ({ payload }) => {
      const doc = await payload.create({
        collection: focalNoSizesSlug, // config without sizes
        data: {
          // No focal point
        },
        file,
      })

      expect(doc.focalX).toEqual(50)
      expect(doc.focalY).toEqual(50)

      await payload.delete({ collection: focalNoSizesSlug, id: doc.id })
    })
  })

  test.describe('Image Manipulation', () => {
    test('should enlarge images if resize options `withoutEnlargement` is set to false', async ({
      payload,
    }) => {
      const small = await getFileByPath(path.resolve(dirname, './small.png'))

      const result = await payload.create({
        collection: enlargeSlug,
        data: {},
        file: small,
      })

      expect(result).toBeTruthy()

      const { sizes } = result as unknown as Enlarge
      const expectedPath = path.join(dirname, './media/enlarge')

      // Check for files
      expect(await fileExists(path.join(expectedPath, small.name))).toBe(true)
      expect(await fileExists(path.join(expectedPath, sizes.resizedLarger.filename))).toBe(true)
      expect(await fileExists(path.join(expectedPath, sizes.resizedSmaller.filename))).toBe(true)
      expect(await fileExists(path.join(expectedPath, sizes.accidentalSameSize.filename))).toBe(
        true,
      )
      expect(await fileExists(path.join(expectedPath, sizes.sameSizeWithNewFormat.filename))).toBe(
        true,
      )

      // Check api response
      expect(sizes.sameSizeWithNewFormat.mimeType).toBe('image/jpeg')
      expect(sizes.sameSizeWithNewFormat.filename).toBe('small-320x80.jpg')

      expect(sizes.resizedLarger.mimeType).toBe('image/png')
      expect(sizes.resizedLarger.filename).toBe('small-640x480.png')

      expect(sizes.resizedSmaller.mimeType).toBe('image/png')
      expect(sizes.resizedSmaller.filename).toBe('small-180x50.png')

      expect(sizes.accidentalSameSize.mimeType).toBe('image/png')
      expect(sizes.accidentalSameSize.filename).toBe('small-320x80.png')

      await payload.delete({
        collection: enlargeSlug,
        id: result.id,
      })
    })

    // This test makes sure that the image resizing is not prevented if only one dimension is larger (due to payload preventing enlargement by default)
    test('should resize images if one desired dimension is smaller and the other is larger', async ({
      payload,
    }) => {
      const small = await getFileByPath(path.resolve(dirname, './small.png'))

      const result = (await payload.create({
        collection: enlargeSlug,
        data: {},
        file: small,
      })) as unknown as Enlarge

      expect(result).toBeTruthy()

      const { sizes } = result
      const expectedPath = path.join(dirname, './media/enlarge')

      // Check for files
      expect(await fileExists(path.join(expectedPath, sizes.widthLowerHeightLarger.filename))).toBe(
        true,
      )
      // Check api response
      expect(sizes.widthLowerHeightLarger.mimeType).toBe('image/png')
      expect(sizes.widthLowerHeightLarger.filename).toBe('small-300x300.png')
      await payload.delete({
        collection: enlargeSlug,
        id: result.id,
      })
    })

    test('should not reduce images if resize options `withoutReduction` is set to true', async ({
      payload,
    }) => {
      const small = await getFileByPath(path.resolve(dirname, './small.png'))

      const result = await payload.create({
        collection: reduceSlug,
        data: {},
        file: small,
      })

      expect(result).toBeTruthy()

      const { sizes } = result as unknown as Enlarge
      const expectedPath = path.join(dirname, './media/reduce')

      // Check for files
      expect(await fileExists(path.join(expectedPath, small.name))).toBe(true)
      expect(await fileExists(path.join(expectedPath, 'small-640x480.png'))).toBe(false)
      expect(await fileExists(path.join(expectedPath, 'small-180x50.png'))).toBe(false)
      expect(await fileExists(path.join(expectedPath, sizes.accidentalSameSize.filename))).toBe(
        true,
      )
      expect(await fileExists(path.join(expectedPath, sizes.sameSizeWithNewFormat.filename))).toBe(
        true,
      )

      // Check api response
      expect(sizes.sameSizeWithNewFormat.mimeType).toBe('image/jpeg')
      expect(sizes.sameSizeWithNewFormat.filename).toBe('small-320x80.jpg')

      expect(sizes.resizedLarger.mimeType).toBeNull()
      expect(sizes.resizedLarger.filename).toBeNull()

      expect(sizes.accidentalSameSize.mimeType).toBe('image/png')
      expect(sizes.resizedSmaller.filename).toBe('small-320x80.png')

      expect(sizes.accidentalSameSize.mimeType).toBe('image/png')
      expect(sizes.accidentalSameSize.filename).toBe('small-320x80.png')

      await payload.delete({ collection: reduceSlug, id: result.id })
    })

    test('should not enlarge image if `withoutEnlargement` is set to undefined and width or height is undefined when imageSizes are larger than the uploaded image', async ({
      payload,
    }) => {
      const small = await getFileByPath(path.resolve(dirname, './small.png'))

      const result = await payload.create({
        collection: enlargeSlug,
        data: {},
        file: small,
      })

      expect(result).toBeTruthy()

      const { sizes } = result as unknown as Enlarge

      expect(sizes.undefinedHeightWithoutEnlargement).toMatchObject({
        filename: null,
        filesize: null,
        height: null,
        mimeType: null,
        url: null,
        width: null,
      })

      await payload.delete({
        collection: enlargeSlug,
        id: result.id,
      })
    })
  })

  test.describe('Required Files', () => {
    test('should allow file to be optional if filesRequiredOnCreate is false', async ({
      payload,
    }) => {
      const successfulCreate = await payload.create({
        collection: 'optional-file',
        data: {},
      })

      expect(successfulCreate.id).toBeDefined()
    })

    test('should throw an error if no file and filesRequiredOnCreate is true', async ({
      payload,
    }) => {
      await expect(async () =>
        payload.create({
          collection: 'required-file',
          data: {},
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          name: 'MissingFile',
          message: 'No files were uploaded.',
        }),
      )
    })
    test('should throw an error if no file and filesRequiredOnCreate is not defined', async ({
      payload,
    }) => {
      await expect(async () =>
        payload.create({
          collection: mediaSlug,
          data: {},
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          name: 'MissingFile',
          message: 'No files were uploaded.',
        }),
      )
    })
  })

  test.describe('Duplicate', () => {
    test('should duplicate upload collection doc', async ({ payload }) => {
      const filePath = path.resolve(dirname, './image.png')
      const file = await getFileByPath(filePath)
      file.name = 'file-to-duplicate.png'

      const mediaDoc = await payload.create({
        collection: 'media',
        data: {},
        file,
      })

      expect(mediaDoc).toBeDefined()

      const duplicatedDoc = await payload.duplicate({
        collection: 'media',
        id: mediaDoc.id,
      })

      const expectedPath = path.join(dirname, './media')

      expect(await fileExists(path.join(expectedPath, duplicatedDoc.filename))).toBe(true)

      await payload.delete({ collection: 'media', id: mediaDoc.id })
      await payload.delete({ collection: 'media', id: duplicatedDoc.id })
    })

    test('should not leak req.file between sequential duplicate() calls on a shared req', async ({
      payload,
    }) => {
      const filePath1 = path.resolve(dirname, './image.png')
      const file1 = await getFileByPath(filePath1)
      file1.name = 'alpha-leak-test.png'

      const filePath2 = path.resolve(dirname, './small.png')
      const file2 = await getFileByPath(filePath2)
      file2.name = 'bravo-leak-test.png'

      const doc1 = await payload.create({
        collection: mediaSlug,
        data: {},
        file: file1,
      })

      const doc2 = await payload.create({
        collection: mediaSlug,
        data: {},
        file: file2,
      })

      // Use a shared req object to simulate batch operations within a transaction
      const req = {} as PayloadRequest

      const dup1 = await payload.duplicate({
        collection: mediaSlug,
        id: doc1.id,
        req,
      })

      const dup2 = await payload.duplicate({
        collection: mediaSlug,
        id: doc2.id,
        req,
      })

      // dup1 should derive from alpha-leak-test.png
      expect(dup1.filename).toContain('alpha-leak-test')
      // dup2 should derive from bravo-leak-test.png, NOT alpha-leak-test.png
      expect(dup2.filename).toContain('bravo-leak-test')

      // Clean up created docs
      await payload.delete({ collection: mediaSlug, id: doc1.id })
      await payload.delete({ collection: mediaSlug, id: doc2.id })
      await payload.delete({ collection: mediaSlug, id: dup1.id })
      await payload.delete({ collection: mediaSlug, id: dup2.id })
    })
  })

  test.describe('serverURL handling', () => {
    test('should store relative URLs in database even when serverURL is set', async ({
      payload,
    }) => {
      // Temporarily set serverURL for this test
      const originalServerURL = payload.config.serverURL
      payload.config.serverURL = 'http://local-images:3000'

      try {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        expect(file).toBeDefined()
        file!.name = 'serverurl-test.png'

        // Create an upload
        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        expect(mediaDoc).toBeDefined()
        expect(mediaDoc.url).toBeDefined()

        // payload.find should return full URLs with serverURL prefix (through afterRead hooks)
        expect(mediaDoc.url).toContain('http://local-images:3000')
        expect(mediaDoc.sizes?.tablet?.url).toContain('http://local-images:3000')
        expect(mediaDoc.sizes?.icon?.url).toContain('http://local-images:3000')

        // Direct database query should return relative URLs (no hooks applied)
        const dbDoc = (await payload.db.findOne({
          collection: mediaSlug,
          where: {
            id: {
              equals: mediaDoc.id,
            },
          },
        })) as unknown as Media

        expect(dbDoc).toBeDefined()
        expect(dbDoc.url).toBeDefined()
        expect(dbDoc.url).not.toContain('http://local-images:3000')
        expect(dbDoc.url).toMatch(/^\/api\/media\/file\//)

        // Check that size URLs are also relative in the database
        expect(dbDoc.sizes?.tablet?.url).toBeDefined()
        expect(dbDoc.sizes?.tablet?.url).not.toContain('http://local-images:3000')
        expect(dbDoc.sizes?.tablet?.url).toMatch(/^\/api\/media\/file\//)

        expect(dbDoc.sizes?.icon?.url).toBeDefined()
        expect(dbDoc.sizes?.icon?.url).not.toContain('http://local-images:3000')
        expect(dbDoc.sizes?.icon?.url).toMatch(/^\/api\/media\/file\//)

        await payload.delete({ collection: mediaSlug, id: mediaDoc.id })
      } finally {
        // Restore original serverURL
        payload.config.serverURL = originalServerURL
      }
    })

    test('should strip serverURL when duplicating an upload with serverURL set', async ({
      payload,
    }) => {
      // Temporarily set serverURL for this test
      const originalServerURL = payload.config.serverURL
      payload.config.serverURL = 'http://local-images:3000'

      try {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        expect(file).toBeDefined()
        file!.name = 'duplicate-serverurl-test.png'

        // Create an upload
        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        expect(mediaDoc).toBeDefined()

        // Duplicate the upload (this will pass full URLs from afterRead hooks)
        const duplicatedDoc = (await payload.duplicate({
          collection: mediaSlug,
          id: mediaDoc.id,
        })) as unknown as Media

        expect(duplicatedDoc).toBeDefined()
        expect(duplicatedDoc.id).not.toEqual(mediaDoc.id)

        // Check that the duplicated file exists
        const expectedPath = path.join(dirname, './media')
        expect(duplicatedDoc.filename).toBeDefined()
        expect(await fileExists(path.join(expectedPath, duplicatedDoc.filename!))).toBe(true)

        // Direct database query on duplicated doc should return relative URLs
        const dbDoc = (await payload.db.findOne({
          collection: mediaSlug,
          where: {
            id: {
              equals: duplicatedDoc.id,
            },
          },
        })) as unknown as Media

        expect(dbDoc).toBeDefined()
        expect(dbDoc.url).toBeDefined()
        expect(dbDoc.url).not.toContain('http://local-images:3000')
        expect(dbDoc.url).toMatch(/^\/api\/media\/file\//)

        // Check that size URLs are also relative in the database
        expect(dbDoc.sizes?.tablet?.url).toBeDefined()
        expect(dbDoc.sizes?.tablet?.url).not.toContain('http://local-images:3000')
        expect(dbDoc.sizes?.tablet?.url).toMatch(/^\/api\/media\/file\//)

        await payload.delete({ collection: mediaSlug, id: mediaDoc.id })
        await payload.delete({ collection: mediaSlug, id: duplicatedDoc.id })
      } finally {
        // Restore original serverURL
        payload.config.serverURL = originalServerURL
      }
    })

    test('should strip serverURL when updating an upload with serverURL set', async ({
      payload,
    }) => {
      // Temporarily set serverURL for this test
      const originalServerURL = payload.config.serverURL
      payload.config.serverURL = 'http://local-images:3000'

      try {
        const filePath = path.resolve(dirname, './image.png')
        const file = await getFileByPath(filePath)
        expect(file).toBeDefined()
        file!.name = 'update-serverurl-test.png'

        // Create an upload
        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file,
        })) as unknown as Media

        expect(mediaDoc).toBeDefined()

        // Update the upload (changing focal point triggers a re-upload)
        const updatedDoc = (await payload.update({
          collection: mediaSlug,
          id: mediaDoc.id,
          data: {
            focalX: 75,
            focalY: 25,
          },
        })) as unknown as Media

        expect(updatedDoc).toBeDefined()
        expect(updatedDoc.focalX).toEqual(75)
        expect(updatedDoc.focalY).toEqual(25)

        // Direct database query on updated doc should return relative URLs
        const dbDoc = (await payload.db.findOne({
          collection: mediaSlug,
          where: {
            id: {
              equals: updatedDoc.id,
            },
          },
        })) as unknown as Media

        expect(dbDoc).toBeDefined()
        expect(dbDoc.url).toBeDefined()
        expect(dbDoc.url).not.toContain('http://local-images:3000')
        expect(dbDoc.url).toMatch(/^\/api\/media\/file\//)

        // Check that size URLs are also relative in the database
        expect(dbDoc.sizes?.tablet?.url).toBeDefined()
        expect(dbDoc.sizes?.tablet?.url).not.toContain('http://local-images:3000')
        expect(dbDoc.sizes?.tablet?.url).toMatch(/^\/api\/media\/file\//)

        await payload.delete({ collection: mediaSlug, id: mediaDoc.id })
      } finally {
        // Restore original serverURL
        payload.config.serverURL = originalServerURL
      }
    })
  })

  test.describe('HTTP Range Requests', () => {
    let uploadedDoc: Media
    let uploadedFilename: string
    let fileSize: number

    test.beforeEach(async ({ payload }) => {
      // Upload a test file for range request testing
      const filePath = path.join(dirname, './audio.mp3')
      const file = await getFileByPath(filePath)

      uploadedDoc = (await payload.create({
        collection: mediaSlug,
        data: {},
        file,
      })) as unknown as Media

      uploadedFilename = uploadedDoc.filename
      const stats = await stat(filePath)
      fileSize = stats.size
    })

    test('should return Accept-Ranges header on full file request', async ({ restClient }) => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`)

      expect(response.status).toBe(200)
      expect(response.headers.get('Accept-Ranges')).toBe('bytes')
      expect(response.headers.get('Content-Length')).toBe(String(fileSize))
    })

    test('should handle range request with single byte range', async ({ restClient }) => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: 'bytes=0-1023' },
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe(`bytes 0-1023/${fileSize}`)
      expect(response.headers.get('Content-Length')).toBe('1024')
      expect(response.headers.get('Accept-Ranges')).toBe('bytes')

      const arrayBuffer = await response.arrayBuffer()
      expect(arrayBuffer.byteLength).toBe(1024)
    })

    test('should handle range request with open-ended range', async ({ restClient }) => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: 'bytes=1024-' },
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe(`bytes 1024-${fileSize - 1}/${fileSize}`)
      expect(response.headers.get('Content-Length')).toBe(String(fileSize - 1024))

      const arrayBuffer = await response.arrayBuffer()
      expect(arrayBuffer.byteLength).toBe(fileSize - 1024)
    })

    test('should handle range request for suffix bytes', async ({ restClient }) => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: 'bytes=-512' },
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe(
        `bytes ${fileSize - 512}-${fileSize - 1}/${fileSize}`,
      )
      expect(response.headers.get('Content-Length')).toBe('512')

      const arrayBuffer = await response.arrayBuffer()
      expect(arrayBuffer.byteLength).toBe(512)
    })

    test('should return 416 for invalid range (start > file size)', async ({ restClient }) => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: `bytes=${fileSize + 1000}-` },
      })

      expect(response.status).toBe(416)
      expect(response.headers.get('Content-Range')).toBe(`bytes */${fileSize}`)
    })

    test('should handle multi-range requests by returning first range', async ({ restClient }) => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: 'bytes=0-1023,2048-3071' },
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe(`bytes 0-1023/${fileSize}`)
      expect(response.headers.get('Content-Length')).toBe('1024')

      const arrayBuffer = await response.arrayBuffer()
      expect(arrayBuffer.byteLength).toBe(1024)
    })

    test('should handle range at end of file', async ({ restClient }) => {
      const lastByte = fileSize - 1
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: `bytes=${lastByte}-${lastByte}` },
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe(
        `bytes ${lastByte}-${lastByte}/${fileSize}`,
      )
      expect(response.headers.get('Content-Length')).toBe('1')

      const arrayBuffer = await response.arrayBuffer()
      expect(arrayBuffer.byteLength).toBe(1)
    })
  })

  test.describe('SVG Security', () => {
    let xssPayloadDoc: Media
    const docIDs: (number | string)[] = []

    test.afterAll(async ({ payloadInstance }) => {
      for (const id of docIDs) {
        try {
          await payloadInstance.delete({
            collection: noRestrictFileTypesSlug as CollectionSlug,
            id,
          })
        } catch {
          // ignore
        }
      }
    })

    test('should serve SVG files with Content-Security-Policy header to prevent XSS', async ({
      payload,
      restClient,
    }) => {
      // Upload an SVG with embedded JavaScript
      const filePath = path.resolve(dirname, './xss-payload.svg')
      const file = await getFileByPath(filePath)

      xssPayloadDoc = (await payload.create({
        collection: noRestrictFileTypesSlug as CollectionSlug,
        data: {},
        file,
      })) as unknown as Media

      docIDs.push(xssPayloadDoc.id)

      // Fetch the SVG file
      const response = await restClient.GET(
        `/${noRestrictFileTypesSlug}/file/${xssPayloadDoc.filename}`,
      )

      expect(response.status).toBe(200)

      // Verify the Content-Security-Policy header is present
      const cspHeader = response.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeTruthy()
      expect(cspHeader).toContain("script-src 'none'")
    })

    test('should serve all SVG files with CSP headers regardless of content', async ({
      payload,
      restClient,
    }) => {
      // Upload a safe SVG file
      const filePath = path.resolve(dirname, './image.svg')
      const file = await getFileByPath(filePath)

      const safeDoc = (await payload.create({
        collection: svgOnlySlug as CollectionSlug,
        data: {},
        file,
      })) as unknown as Media

      docIDs.push(safeDoc.id)

      // Fetch the uploaded SVG file
      const response = await restClient.GET(`/${svgOnlySlug}/file/${safeDoc.filename}`)

      expect(response.status).toBe(200)

      // Expect to have CSP headers
      const cspHeader = response.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeTruthy()
      expect(cspHeader).toContain("script-src 'none'")
    })
  })

  test.describe('External File Upload - Redirect Blocking', () => {
    const validPNG = Buffer.from(
      '89504e470d0a1a0a0000000d494844520000000100000001' +
        '0806000000ifad8300000010494441541865000000018001' +
        'ffa500051f37dbba0000000049454e44ae426082',
      'hex',
    )

    const startServer = async (server: ReturnType<typeof createServer>): Promise<number> => {
      return new Promise<number>((resolve) => {
        server.listen(0, '0.0.0.0', () => {
          resolve((server.address() as AddressInfo).port)
        })
      })
    }

    test('should block malicious redirect', async ({ payload }) => {
      const internalServer = createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('SECRET_CREDENTIALS')
      })

      const internalServerPort = await startServer(internalServer)

      const attackerServer = createServer((req, res) => {
        res.writeHead(302, {
          Location: `http://127.0.0.1:${internalServerPort}/secret`,
        })
        res.end()
      })

      const attackerServerPort = await startServer(attackerServer)

      try {
        await expect(
          payload.create({
            collection: mediaSlug,
            data: {
              filename: 'malicious.jpg',
              url: `http://127.0.0.1:${attackerServerPort}/image.jpg`,
            },
          }),
        ).rejects.toThrow()
      } finally {
        attackerServer.close()
        internalServer.close()
      }
    })

    test('should allow legitimate redirects within allowlist', async ({ payload }) => {
      const edgeServer = createServer((req, res) => {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': validPNG.length.toString(),
        })
        res.end(validPNG)
      })

      const edgeServerPort = await startServer(edgeServer)

      const cdnServer = createServer((req, res) => {
        res.writeHead(302, { Location: `http://127.0.0.1:${edgeServerPort}/image.png` })
        res.end()
      })

      const cdnServerPort = await startServer(cdnServer)

      try {
        const doc = await payload.create({
          collection: allowListMediaSlug,
          data: {
            filename: 'cdn-image.png',
            url: `http://127.0.0.1:${cdnServerPort}/image.png`,
          },
        })

        expect(doc.filename).toBe('cdn-image.png')
        expect(doc.mimeType).toBe('image/png')
      } finally {
        cdnServer.close()
        edgeServer.close()
      }
    })

    test('should enforce allowList on redirect targets', async ({ payload }) => {
      const redirectServer = createServer((req, res) => {
        // Redirect to a host that is NOT on the allowList
        res.writeHead(302, { Location: 'http://192.168.99.99/file.png' })
        res.end()
      })

      const redirectServerPort = await startServer(redirectServer)

      try {
        await expect(
          payload.create({
            collection: allowListMediaSlug,
            data: {
              filename: 'redirect-test.png',
              url: `http://127.0.0.1:${redirectServerPort}/image.png`,
            },
          }),
        ).rejects.toThrow()
      } finally {
        redirectServer.close()
      }
    })

    test('should not allow infinite redirect loops', async ({ payload }) => {
      // eslint-disable-next-line prefer-const
      let redirectServerPort: number

      const redirectServer = createServer((req, res) => {
        res.writeHead(302, { Location: `http://127.0.0.1:${redirectServerPort}/loop` })
        res.end()
      })

      redirectServerPort = await startServer(redirectServer)

      try {
        await expect(
          payload.create({
            collection: allowListMediaSlug,
            data: {
              filename: 'loop.png',
              url: `http://127.0.0.1:${redirectServerPort}/loop`,
            },
          }),
        ).rejects.toThrow(/Too many redirects/)
      } finally {
        redirectServer.close()
      }
    })
  })

  test.describe('paste-url endpoint', () => {
    test('should return 400 when pasteURL is not configured', async ({ restClient }) => {
      const response = await restClient.GET(`/${mediaSlug}/paste-url`, {
        query: { src: 'http://example.com/file.png' },
      })
      expect(response.status).toBe(400)
    })

    test('should return 400 when pasteURL is disabled', async ({ restClient }) => {
      const response = await restClient.GET(`/${focalNoSizesSlug}/paste-url`, {
        query: { src: 'http://example.com/file.png' },
      })
      expect(response.status).toBe(400)
    })

    test('should reject requests to non-public addresses', async ({ restClient }) => {
      const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`, {
        query: { src: 'http://127.0.0.1/file.png' },
      })
      expect(response.status).toBe(500)
    })

    test('should validate resolved addresses', async ({ restClient }) => {
      const globalCachedFn = _internal_safeFetchGlobal.lookup

      // @ts-expect-error mock lookup
      _internal_safeFetchGlobal.lookup = (_hostname, _options, callback) => {
        callback(null, '127.0.0.1' as any, 4)
      }

      try {
        const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`, {
          query: { src: 'http://localhost/file.png' },
        })
        expect(response.status).toBe(500)
      } finally {
        _internal_safeFetchGlobal.lookup = globalCachedFn
      }
    })

    test('should reject URLs not matching the allowList', async ({ restClient }) => {
      const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`, {
        query: { src: 'http://other.example.com/file.png' },
      })
      expect(response.status).toBe(400)
    })

    test('should require authentication', async ({ restClient }) => {
      const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`, {
        query: { src: 'http://127.0.0.1/file.png' },
        auth: false,
      })
      expect(response.status).toBe(403)
    })

    test('should require a src query parameter', async ({ restClient }) => {
      const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe('tempFileDir', () => {
    test.each([
      { dir: '/tmp', expectedPrefix: '/tmp', description: 'absolute path like /tmp' },
      { dir: 'tmp', expectedPrefix: path.join(process.cwd(), 'tmp'), description: 'relative path' },
    ])('creates temp files in correct location for $description', ({ dir, expectedPrefix }) => {
      const handler = tempFileHandler({ tempFileDir: dir }, 'field', 'file.png')
      const filePath = handler.getFilePath()

      expect(filePath.startsWith(expectedPrefix)).toBe(true)
      handler.cleanup()
    })
  })

  test.describe('prefix query parameter', () => {
    const docIDs: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of docIDs) {
        try {
          await payload.delete({ collection: prefixMediaSlug, id })
        } catch {
          // noop — file may already have been deleted
        }
      }
      docIDs.length = 0
    })

    test('should return 200 when the prefix query param matches the stored document prefix', async ({
      payload,
      restClient,
    }) => {
      const filePath = path.resolve(dirname, './image.png')
      const file = await getFileByPath(filePath)

      const doc = await payload.create({
        collection: prefixMediaSlug,
        data: { prefix: 'abc123' },
        file,
      })

      docIDs.push(doc.id)

      const response = await restClient.GET(
        `/${prefixMediaSlug}/file/${doc.filename}?prefix=abc123`,
      )

      expect(response.status).toBe(200)
    })

    test('should return 403 when the prefix query param does not match the stored document prefix', async ({
      payload,
      restClient,
    }) => {
      const filePath = path.resolve(dirname, './image.png')
      const file = await getFileByPath(filePath)

      const doc = await payload.create({
        collection: prefixMediaSlug,
        data: { prefix: 'abc123' },
        file,
      })

      docIDs.push(doc.id)

      const response = await restClient.GET(
        `/${prefixMediaSlug}/file/${doc.filename}?prefix=wrongprefix`,
      )

      expect(response.status).toBe(403)
    })

    test('should return 200 without prefix param for documents that have no prefix (backward compatibility)', async ({
      payload,
      restClient,
    }) => {
      const filePath = path.resolve(dirname, './image.png')
      const file = await getFileByPath(filePath)

      const doc = await payload.create({
        collection: prefixMediaSlug,
        data: {},
        file,
      })

      docIDs.push(doc.id)

      const response = await restClient.GET(`/${prefixMediaSlug}/file/${doc.filename}`)

      expect(response.status).toBe(200)
    })

    test('should return 403 when prefix param is provided but no document has a matching prefix', async ({
      payload,
      restClient,
    }) => {
      const filePath = path.resolve(dirname, './image.png')
      const file = await getFileByPath(filePath)

      const doc = await payload.create({
        collection: prefixMediaSlug,
        data: {},
        file,
      })

      docIDs.push(doc.id)

      const response = await restClient.GET(
        `/${prefixMediaSlug}/file/${doc.filename}?prefix=nonexistent`,
      )

      expect(response.status).toBe(403)
    })
  })

  /**
   * `client-upload-temp-file` forces the `'full'` content requirement (see
   * getFileContentRequirement.ts), so every request against it fetches the file through
   * `getFileFromUploadInstructions` into its own temp file, regardless of the global
   * `useTempFiles` setting (see unlinkTempFiles.ts). These temp files live under `os.tmpdir()`
   * with a `payload-client-upload-` prefix - this is a regression test for those files leaking
   * on disk when something after the fetch (e.g. a `beforeChange` hook) makes the operation fail.
   */
  test.describe('client upload temp file cleanup', () => {
    const createdIds: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdIds) {
        await payload.delete({ id, collection: clientUploadTempFileSlug })
      }
      createdIds.length = 0
    })

    const listClientUploadTempFiles = async (): Promise<Set<string>> => {
      const entries = await fs.promises.readdir(os.tmpdir()).catch(() => [] as string[])
      return new Set(entries.filter((name) => name.startsWith('payload-client-upload-')))
    }

    const clientUploadFormData = (overrides: Record<string, unknown> = {}) => {
      const formData = new FormData()
      if (Object.keys(overrides).length > 0) {
        formData.append('_payload', JSON.stringify(overrides))
      }
      formData.append(
        'file',
        JSON.stringify({
          filename: 'client-upload-temp-file.png',
          mimeType: 'image/png',
          size: 1,
          uploadReference: { key: 'unused' },
        }),
      )
      return formData
    }

    test('removes the temp file after a successful create', async ({ restClient }) => {
      const before = await listClientUploadTempFiles()

      const response = await restClient.POST(`/${clientUploadTempFileSlug}`, {
        body: clientUploadFormData(),
      })
      expect(response.status).toBe(201)
      const { doc } = await response.json()
      createdIds.push(doc.id)

      expect(await listClientUploadTempFiles()).toEqual(before)
    })

    test('removes the temp file even when a beforeChange hook throws after the file was fetched', async ({
      restClient,
    }) => {
      const before = await listClientUploadTempFiles()

      const response = await restClient.POST(`/${clientUploadTempFileSlug}`, {
        body: clientUploadFormData({ shouldFail: true }),
      })
      expect(response.status).toBe(422)

      expect(await listClientUploadTempFiles()).toEqual(before)
    })
  })

  /**
   * When local storage is enabled and no image processing changes the bytes, generateFileData
   * copies straight from `file.tempFilePath` to its destination instead of reading the whole
   * file into memory (see generateFileData.ts). `mediaSlug` has no restrictions on non-image
   * mime types, so an audio file uploaded there skips all sharp processing and exercises that
   * copy against real disk I/O.
   */
  test.describe('temp file copy to local storage', () => {
    const createdIds: (number | string)[] = []
    const tempFilesToClean: string[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdIds) {
        await payload.delete({ id, collection: mediaSlug })
      }
      createdIds.length = 0

      for (const tempFilePath of tempFilesToClean) {
        await fs.promises.rm(tempFilePath, { force: true })
      }
      tempFilesToClean.length = 0
    })

    test('copies the temp file to its destination instead of reading it into memory', async ({
      payload,
    }) => {
      const fileContents = Buffer.from(`fake-audio-bytes-${randomUUID()}`)
      const tempFilePath = path.join(os.tmpdir(), `payload-test-temp-file-${randomUUID()}.mp3`)
      await fs.promises.writeFile(tempFilePath, fileContents)
      tempFilesToClean.push(tempFilePath)

      // fs.promises is the same object `fs/promises` exports, so this observes the real calls
      // generateFileData.ts/uploadFiles.ts make - it doesn't replace their behavior.
      const copyFileSpy = vitest.spyOn(fs.promises, 'copyFile')
      const readFileSpy = vitest.spyOn(fs.promises, 'readFile')

      const doc = await payload.create({
        collection: mediaSlug,
        data: {},
        file: {
          name: `temp-file-copy-${randomUUID()}.mp3`,
          data: Buffer.alloc(0),
          mimetype: 'audio/mpeg',
          size: fileContents.length,
          tempFilePath,
        },
      })

      createdIds.push(doc.id)

      const savedFilePath = path.join(dirname, './media', doc.filename)

      expect(copyFileSpy).toHaveBeenCalledWith(tempFilePath, savedFilePath)
      expect(readFileSpy).not.toHaveBeenCalledWith(tempFilePath)

      copyFileSpy.mockRestore()
      readFileSpy.mockRestore()

      expect(doc.filesize).toBe(fileContents.length)
      expect(await fileExists(savedFilePath)).toBe(true)
      expect(await fs.promises.readFile(savedFilePath)).toEqual(fileContents)

      // Copied, not moved - the original temp file must be untouched.
      expect(await fileExists(tempFilePath)).toBe(true)
      expect(await fs.promises.readFile(tempFilePath)).toEqual(fileContents)
    })
  })
})

async function fileExists(fileName: string): Promise<boolean> {
  try {
    await stat(fileName)
    return true
  } catch (_err) {
    return false
  }
}

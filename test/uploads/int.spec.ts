import type { AddressInfo } from 'net'
import type { CollectionSlug, Payload } from 'payload'

import { randomUUID } from 'crypto'
import fs from 'fs'
import { createServer } from 'http'
import path from 'path'
import { _internal_safeFetchGlobal, createPayloadRequest, getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { afterAll, beforeAll, describe, expect, it, vitest } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Enlarge, Media } from './payload-types.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { getExternalFile } from '../../packages/payload/src/uploads/getExternalFile.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { tempFileHandler } from '../../packages/payload/src/uploads/fetchAPI-multipart/handlers.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { createStreamableFile } from './createStreamableFile.js'
import {
  allowListMediaSlug,
  anyImagesSlug,
  enlargeSlug,
  focalNoSizesSlug,
  focalOnlySlug,
  mediaSlug,
  noRestrictFileMimeTypesSlug,
  noRestrictFileTypesSlug,
  pdfOnlySlug,
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

let restClient: NextRESTClient
let payload: Payload

describe('Collections - Uploads', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await restClient.login({ slug: usersSlug })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('REST API', () => {
    describe('create', () => {
      it('creates from form data given a png', async () => {
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

      it('should URL encode filenames with spaces in both main url and size urls', async () => {
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
      })

      it('creates from form data given an svg', async () => {
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

      it('should upload svg in an image mimetype restricted collection', async () => {
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

      it('should have valid image url', async () => {
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

      it('creates images that do not require all sizes', async () => {
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

      it('should not set url on image sizes that cannot be generated', async () => {
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

      it('creates images from a different format', async () => {
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

      it('creates media without storing a file', async () => {
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

      it('should not allow creation of corrupted PDF', async () => {
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

      it('should not allow html file to be uploaded to PDF only collection', async () => {
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

      it('should not allow invalid mimeType to be created', async () => {
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

      it('should not allow corrupted SVG to be created', async () => {
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
    describe('update', () => {
      it('should replace image and delete old files - by ID', async () => {
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

      it('should replace image and delete old files - where query', async () => {
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
    describe('delete', () => {
      it('should remove related files when deleting by ID', async () => {
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

      it('should remove all related files when deleting with where query', async () => {
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
    describe('read', () => {
      it('should return the media document with the correct file type', async () => {
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
      })
    })
  })

  describe('Local API', () => {
    describe('create', () => {
      it('should create documents when passing filePath', async () => {
        const expectedPath = path.join(dirname, './svg-only')

        const svgFilePath = path.resolve(dirname, './svgWithXml.svg')
        const doc = await payload.create({
          collection: svgOnlySlug as CollectionSlug,
          data: {},
          filePath: svgFilePath,
        })

        expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)
      })

      it('should create documents when passing file', async () => {
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
      })

      it('should upload svg files', async () => {
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
    })

    describe('update', () => {
      it('should remove existing media on re-upload - by ID', async () => {
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
      })

      it('should remove existing media on re-upload - where query', async () => {
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
      })

      it('should remove sizes that do not pertain to the new image - by ID', async () => {
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

      it('should remove sizes that do not pertain to the new image - where query', async () => {
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

      it('should allow removing file from upload relationship field - by ID', async () => {
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

      it('should allow update removing a relationship - where query', async () => {
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

      it('should allow a localized upload relationship in a block', async () => {
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

    describe('cookie filtering', () => {
      it('should filter out payload cookies when externalFileHeaderFilter is not defined', async () => {
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

      it('getExternalFile should not filter out payload cookies when externalFileHeaderFilter is not defined and the URL is not external', async () => {
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

      it('should keep all cookies when externalFileHeaderFilter is defined', async () => {
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

    describe('filters', () => {
      it.each`
        url                                  | collection            | errorContains
        ${'http://127.0.0.1/file.png'}       | ${mediaSlug}          | ${'unsafe'}
        ${'http://[::1]/file.png'}           | ${mediaSlug}          | ${'unsafe'}
        ${'http://10.0.0.1/file.png'}        | ${mediaSlug}          | ${'unsafe'}
        ${'http://192.168.1.1/file.png'}     | ${mediaSlug}          | ${'unsafe'}
        ${'http://172.16.0.1/file.png'}      | ${mediaSlug}          | ${'unsafe'}
        ${'http://169.254.1.1/file.png'}     | ${mediaSlug}          | ${'unsafe'}
        ${'http://224.0.0.1/file.png'}       | ${mediaSlug}          | ${'unsafe'}
        ${'http://0.0.0.0/file.png'}         | ${mediaSlug}          | ${'unsafe'}
        ${'http://255.255.255.255/file.png'} | ${mediaSlug}          | ${'unsafe'}
        ${'http://127.0.0.1/file.png'}       | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
        ${'http://[::1]/file.png'}           | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
        ${'http://10.0.0.1/file.png'}        | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
        ${'http://192.168.1.1/file.png'}     | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
        ${'http://172.16.0.1/file.png'}      | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
        ${'http://169.254.1.1/file.png'}     | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
        ${'http://224.0.0.1/file.png'}       | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
        ${'http://0.0.0.0/file.png'}         | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
        ${'http://255.255.255.255/file.png'} | ${allowListMediaSlug} | ${'There was a problem while uploading the file.'}
      `(
        'should block or filter uploading from $collection with URL: $url',
        async ({ url, collection, errorContains }) => {
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
          await expect(
            payload.create({
              collection,
              data: {
                filename: 'test.png',
                url,
              },
            }),
          ).rejects.toThrow(
            expect.objectContaining({
              name: 'FileRetrievalError',
              message: expect.stringContaining(errorContains),
            }),
          )
        },
      )
      it('should fetch when skipSafeFetch is set with a boolean', async () => {
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

      it('should fetch when skipSafeFetch is set with an AllowList', async () => {
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

    describe('file restrictions', () => {
      const file: File = {
        name: `test-${randomUUID()}.html`,
        data: Buffer.from('<html><script>alert("test")</script></html>'),
        mimetype: 'text/html',
        size: 100,
      }
      it('should not allow files with restricted file types', async () => {
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

      it('should allow files with restricted file types when allowRestrictedFileTypes is true', async () => {
        await expect(
          payload.create({
            collection: noRestrictFileTypesSlug as CollectionSlug,
            data: {},
            file,
          }),
        ).resolves.not.toThrow()
      })

      it('should allow files with restricted file types when mimeTypes are set', async () => {
        await expect(
          payload.create({
            collection: noRestrictFileMimeTypesSlug as CollectionSlug,
            data: {},
            file,
          }),
        ).resolves.not.toThrow()
      })
    })
  })

  describe('focal point', () => {
    let file

    beforeAll(async () => {
      // Create image
      const filePath = path.resolve(dirname, './image.png')
      file = await getFileByPath(filePath)
      file.name = 'focal.png'
    })

    it('should be able to set focal point through local API', async () => {
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
    })

    it('should default focal point to 50, 50', async () => {
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
    })

    it('should set focal point even if no sizes defined', async () => {
      const doc = await payload.create({
        collection: focalNoSizesSlug, // config without sizes
        data: {
          // No focal point
        },
        file,
      })

      expect(doc.focalX).toEqual(50)
      expect(doc.focalY).toEqual(50)
    })
  })

  describe('Image Manipulation', () => {
    it('should enlarge images if resize options `withoutEnlargement` is set to false', async () => {
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
    it('should resize images if one desired dimension is smaller and the other is larger', async () => {
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

    it('should not reduce images if resize options `withoutReduction` is set to true', async () => {
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
    })

    it('should not enlarge image if `withoutEnlargement` is set to undefined and width or height is undefined when imageSizes are larger than the uploaded image', async () => {
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

  describe('Required Files', () => {
    it('should allow file to be optional if filesRequiredOnCreate is false', async () => {
      const successfulCreate = await payload.create({
        collection: 'optional-file',
        data: {},
      })

      expect(successfulCreate.id).toBeDefined()
    })

    it('should throw an error if no file and filesRequiredOnCreate is true', async () => {
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
    it('should throw an error if no file and filesRequiredOnCreate is not defined', async () => {
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

  describe('Duplicate', () => {
    it('should duplicate upload collection doc', async () => {
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
    })
  })

  describe('serverURL handling', () => {
    it('should store relative URLs in database even when serverURL is set', async () => {
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
      } finally {
        // Restore original serverURL
        payload.config.serverURL = originalServerURL
      }
    })

    it('should strip serverURL when duplicating an upload with serverURL set', async () => {
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
      } finally {
        // Restore original serverURL
        payload.config.serverURL = originalServerURL
      }
    })

    it('should strip serverURL when updating an upload with serverURL set', async () => {
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
      } finally {
        // Restore original serverURL
        payload.config.serverURL = originalServerURL
      }
    })
  })

  describe('HTTP Range Requests', () => {
    let uploadedDoc: Media
    let uploadedFilename: string
    let fileSize: number

    beforeAll(async () => {
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

    it('should return Accept-Ranges header on full file request', async () => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`)

      expect(response.status).toBe(200)
      expect(response.headers.get('Accept-Ranges')).toBe('bytes')
      expect(response.headers.get('Content-Length')).toBe(String(fileSize))
    })

    it('should handle range request with single byte range', async () => {
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

    it('should handle range request with open-ended range', async () => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: 'bytes=1024-' },
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe(`bytes 1024-${fileSize - 1}/${fileSize}`)
      expect(response.headers.get('Content-Length')).toBe(String(fileSize - 1024))

      const arrayBuffer = await response.arrayBuffer()
      expect(arrayBuffer.byteLength).toBe(fileSize - 1024)
    })

    it('should handle range request for suffix bytes', async () => {
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

    it('should return 416 for invalid range (start > file size)', async () => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: `bytes=${fileSize + 1000}-` },
      })

      expect(response.status).toBe(416)
      expect(response.headers.get('Content-Range')).toBe(`bytes */${fileSize}`)
    })

    it('should handle multi-range requests by returning first range', async () => {
      const response = await restClient.GET(`/${mediaSlug}/file/${uploadedFilename}`, {
        headers: { Range: 'bytes=0-1023,2048-3071' },
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe(`bytes 0-1023/${fileSize}`)
      expect(response.headers.get('Content-Length')).toBe('1024')

      const arrayBuffer = await response.arrayBuffer()
      expect(arrayBuffer.byteLength).toBe(1024)
    })

    it('should handle range at end of file', async () => {
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

  describe('SVG Security', () => {
    let xssPayloadDoc: Media
    const docIDs: (number | string)[] = []

    afterAll(async () => {
      for (const id of docIDs) {
        try {
          await payload.delete({
            collection: noRestrictFileTypesSlug as CollectionSlug,
            id,
          })
        } catch {
          // ignore
        }
      }
    })

    it('should serve SVG files with Content-Security-Policy header to prevent XSS', async () => {
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

    it('should serve all SVG files with CSP headers regardless of content', async () => {
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

  describe('External File Upload - Redirect Blocking', () => {
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

    it('should block malicious redirect', async () => {
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

    it('should allow legitimate redirects within allowlist', async () => {
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

    it('should not allow infinite redirect loops', async () => {
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

  describe('tempFileDir', () => {
    it.each([
      { dir: '/tmp', expectedPrefix: '/tmp', description: 'absolute path like /tmp' },
      { dir: 'tmp', expectedPrefix: path.join(process.cwd(), 'tmp'), description: 'relative path' },
    ])('creates temp files in correct location for $description', ({ dir, expectedPrefix }) => {
      const handler = tempFileHandler({ tempFileDir: dir }, 'field', 'file.png')
      const filePath = handler.getFilePath()

      expect(filePath.startsWith(expectedPrefix)).toBe(true)
      handler.cleanup()
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

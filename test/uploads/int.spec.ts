import type { AddressInfo } from 'net'
import type { CollectionSlug, Payload, PayloadRequest } from 'payload'

import { randomUUID } from 'crypto'
import fs from 'fs'
import { createServer } from 'http'
import os from 'os'
import path from 'path'
import { _internal_safeFetchGlobal, createPayloadRequest, getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { afterAll, afterEach, beforeAll, describe, expect, it, vitest } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Enlarge, Media } from './payload-types.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { checkFileRestrictions } from '../../packages/payload/src/uploads/checkFileRestrictions.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { getExternalFile } from '../../packages/payload/src/uploads/getExternalFile.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { tempFileHandler } from '../../packages/payload/src/uploads/fetchAPI-multipart/handlers.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { createStreamableFile } from './createStreamableFile.js'
import {
  adminThumbnailSizeSlug,
  allowListMediaSlug,
  anyImagesSlug,
  bulkUploadsHookErrorSlug,
  draftReuploadMediaSlug,
  enlargeSlug,
  fileAccessMediaSlug,
  focalNoSizesSlug,
  focalOnlySlug,
  mediaSlug,
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

let restClient: NextRESTClient
let payload: Payload

it('should provide the inspected file type for image processing', async () => {
  const fileContent = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>',
  )

  await expect(
    checkFileRestrictions({
      collection: {
        slug: 'media',
        upload: { staticDir: '/tmp' },
      } as any,
      file: {
        name: 'reference.avif',
        data: fileContent,
        mimetype: 'image/avif',
        size: fileContent.length,
      },
      req: {
        payload: {
          logger: { error: () => {}, warn: () => {} },
        },
      } as unknown as PayloadRequest,
    }),
  ).resolves.toEqual({ ext: 'svg', mime: 'image/svg+xml' })
})

it.each([
  { allowRestrictedFileTypes: false, policy: 'enabled' },
  { allowRestrictedFileTypes: true, policy: 'disabled' },
])(
  'should reject invalid ISO base media box boundaries with type checks $policy',
  async ({ allowRestrictedFileTypes }) => {
    const fileContent = Buffer.concat([
      Buffer.alloc(4),
      Buffer.from('ftypavif'),
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>',
      ),
    ])

    await expect(
      checkFileRestrictions({
        collection: {
          slug: 'media',
          upload: { allowRestrictedFileTypes, mimeTypes: ['image/avif'], staticDir: '/tmp' },
        } as any,
        file: {
          name: 'reference.avif',
          data: fileContent,
          mimetype: 'image/avif',
          size: fileContent.length,
        },
        req: {
          payload: {
            logger: { error: () => {}, warn: () => {} },
          },
        } as unknown as PayloadRequest,
      }),
    ).rejects.toMatchObject({
      data: {
        errors: [{ message: 'Invalid or corrupted ISO base media file.', path: 'file' }],
      },
    })
  },
)

it('should inspect temp-file SVG without whole-file reads', async () => {
  const fileContent = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><text>Reference</text></svg>',
  )
  const tmpFile = path.join(os.tmpdir(), `payload-test-${randomUUID()}`)
  await fs.promises.writeFile(tmpFile, fileContent)
  const readFileSpy = vitest.spyOn(fs.promises, 'readFile')

  try {
    await expect(
      checkFileRestrictions({
        collection: {
          slug: 'media',
          upload: { staticDir: '/tmp' },
        } as any,
        file: {
          name: 'reference.svg',
          data: Buffer.alloc(0),
          mimetype: 'image/svg+xml',
          size: fileContent.length,
          tempFilePath: tmpFile,
        },
        req: {
          payload: {
            logger: { error: () => {}, warn: () => {} },
          },
        } as unknown as PayloadRequest,
      }),
    ).resolves.toEqual({ ext: 'svg', mime: 'image/svg+xml' })

    expect(readFileSpy).not.toHaveBeenCalled()
  } finally {
    readFileSpy.mockRestore()
    await fs.promises.unlink(tmpFile)
  }
})

it.each([
  [
    'default collection metadata',
    'reference.svg',
    'image/svg+xml',
    '<svg xmlns="http://www.w3.org/2000/svg"><script>reference()</script></svg>',
    [],
  ],
  [
    'XML-declared SVG content',
    'reference.svg',
    'application/xml',
    '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="reference()"/>',
    ['image/svg+xml'],
  ],
  [
    'detected XML content with neutral metadata',
    'reference.txt',
    'text/plain',
    '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>reference()</script></svg>',
    [],
  ],
  [
    'decoded URL attributes',
    'reference.svg',
    'image/svg+xml',
    '<svg xmlns="http://www.w3.org/2000/svg"><a href="j&#x61;vascript:reference"/></svg>',
    [],
  ],
  [
    'nested SVG data URLs',
    'reference.svg',
    'image/svg+xml',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/svg+xml,%3Csvg/%3E"/></svg>',
    [],
  ],
  [
    'UTF-16 XML-declared SVG content',
    'reference.xml',
    'application/xml',
    Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from(
        '<?xml version="1.0" encoding="UTF-16"?><svg xmlns="http://www.w3.org/2000/svg" onload="reference()"/>',
        'utf16le',
      ),
    ]),
    [],
  ],
])('should apply SVG content rules for %s', async (_, name, mimetype, content, mimeTypes) => {
  const svgContent = Buffer.from(content)

  await expect(
    checkFileRestrictions({
      collection: {
        slug: 'media',
        upload: { mimeTypes, staticDir: '/tmp' },
      } as any,
      file: {
        name,
        data: svgContent,
        mimetype,
        size: svgContent.length,
      },
      req: {
        payload: {
          logger: { error: () => {}, warn: () => {} },
        },
      } as unknown as PayloadRequest,
    }),
  ).rejects.toMatchObject({
    data: {
      errors: [{ message: 'SVG file contains potentially harmful content.', path: 'file' }],
    },
  })
})

it('should accept ordinary SVG text content', async () => {
  const svgContent = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><text>JavaScript: reference</text></svg>',
  )

  await expect(
    checkFileRestrictions({
      collection: {
        slug: 'media',
        upload: { staticDir: '/tmp' },
      } as any,
      file: {
        name: 'reference.svg',
        data: svgContent,
        mimetype: 'image/svg+xml',
        size: svgContent.length,
      },
      req: {
        payload: {
          logger: { error: () => {}, warn: () => {} },
        },
      } as unknown as PayloadRequest,
    }),
  ).resolves.toEqual({ ext: 'svg', mime: 'image/svg+xml' })
})

it('should accept ordinary non-SVG XML content', async () => {
  const xmlContent = Buffer.from(
    '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Reference</title></feed>',
  )

  await expect(
    checkFileRestrictions({
      collection: {
        slug: 'media',
        upload: { staticDir: '/tmp' },
      } as any,
      file: {
        name: 'reference.txt',
        data: xmlContent,
        mimetype: 'application/atom+xml; charset=utf-8',
        size: xmlContent.length,
      },
      req: {
        payload: {
          logger: { error: () => {}, warn: () => {} },
        },
      } as unknown as PayloadRequest,
    }),
  ).resolves.not.toThrow()
})

it('should apply the default media policy to XHTML metadata', async () => {
  const xhtmlContent = Buffer.from(
    '<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Reference</p></body></html>',
  )

  await expect(
    checkFileRestrictions({
      collection: {
        slug: 'media',
        upload: { staticDir: '/tmp' },
      } as any,
      file: {
        name: 'reference.txt',
        data: xhtmlContent,
        mimetype: 'application/xhtml+xml; charset=utf-8',
        size: xhtmlContent.length,
      },
      req: {
        payload: {
          logger: { error: () => {}, warn: () => {} },
        },
      } as unknown as PayloadRequest,
    }),
  ).rejects.toMatchObject({ name: 'ValidationError' })
})

describe('Collections - Uploads', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await restClient.login({ slug: usersSlug })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('file access on draft reupload', () => {
    const createdIDs: (number | string)[] = []
    const filePrefix = 'test'
    const staticDir = path.resolve(dirname, `./${draftReuploadMediaSlug}`)

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ collection: draftReuploadMediaSlug as CollectionSlug, id })
      }
      createdIDs.length = 0

      // Deleting the document only removes the base row's file; the draft
      // version's reuploaded file is orphaned on disk. Clear the whole static
      // dir so filenames don't collide (and get suffixed) across runs.
      fs.rmSync(staticDir, { force: true, recursive: true })
    })

    it('should serve a file reuploaded on a draft over a published document', async () => {
      const published = await payload.create({
        collection: draftReuploadMediaSlug as CollectionSlug,
        data: { prefix: filePrefix },
        draft: false,
        file: await getFileByPath(path.resolve(dirname, './image.png')),
      })
      createdIDs.push(published.id)

      // Reupload a different file and save as a draft (do not publish). The new
      // filename is written to the latest version only; the base row still
      // points at the published file.
      const draft = await payload.update({
        collection: draftReuploadMediaSlug as CollectionSlug,
        id: published.id,
        data: { prefix: filePrefix },
        draft: true,
        file: await getFileByPath(path.resolve(dirname, './test-image.png')),
      })

      expect(draft.filename).not.toBe(published.filename)

      // The prefix query param (as cloud-storage adapters generate) forces the
      // access check's constrained lookup — the base-row miss this fix repairs
      // by falling back to the latest draft version.
      const draftFileResponse = await restClient.GET(
        `/${draftReuploadMediaSlug}/file/${draft.filename}`,
        { query: { prefix: filePrefix } },
      )

      expect(draftFileResponse.status).toBe(200)
      expect(draftFileResponse.headers.get('content-type')).toContain('image/png')
    })

    it('should still deny access to a filename that matches no document', async () => {
      const doc = await payload.create({
        collection: draftReuploadMediaSlug as CollectionSlug,
        data: { prefix: filePrefix },
        draft: true,
        file: await getFileByPath(path.resolve(dirname, './image.png')),
      })
      createdIDs.push(doc.id)

      const response = await restClient.GET(`/${draftReuploadMediaSlug}/file/does-not-exist.png`, {
        query: { prefix: filePrefix },
      })

      expect(response.status).toBe(403)
    })
  })

  describe('file access with generated image sizes', () => {
    const createdIDs: (number | string)[] = []
    const staticDir = path.resolve(dirname, `./${fileAccessMediaSlug}`)

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: fileAccessMediaSlug as CollectionSlug })
      }
      createdIDs.length = 0
      fs.rmSync(staticDir, { force: true, recursive: true })
    })

    it('should keep generated file data bound to its upload document', async () => {
      const restrictedFile = await getFileByPath(path.resolve(dirname, './test-image.png'))

      restrictedFile!.name = `restricted-${randomUUID()}.png`
      const restrictedDoc = await payload.create({
        collection: fileAccessMediaSlug as CollectionSlug,
        data: { prefix: 'restricted', visibility: 'restricted' },
        file: restrictedFile,
      })

      createdIDs.push(restrictedDoc.id)

      const readableFile = await getFileByPath(path.resolve(dirname, './image.png'))

      readableFile!.name = `readable-${randomUUID()}.png`
      const readableDoc = await payload.create({
        collection: fileAccessMediaSlug as CollectionSlug,
        data: { prefix: 'public', visibility: 'public' },
        file: readableFile,
      })

      createdIDs.push(readableDoc.id)

      const updateResponse = await restClient.PATCH(`/${fileAccessMediaSlug}/${readableDoc.id}`, {
        body: JSON.stringify({
          filename: restrictedDoc.filename,
          prefix: 'restricted',
          sizes: {
            thumbnail: {
              ...readableDoc.sizes.thumbnail,
              filename: restrictedDoc.sizes.thumbnail.filename,
            },
          },
          url: restrictedDoc.url,
          visibility: 'public',
        }),
      })

      expect(updateResponse.status).toBe(200)

      const updatedDoc = await payload.findByID({
        collection: fileAccessMediaSlug as CollectionSlug,
        id: readableDoc.id,
      })

      expect(updatedDoc.filename).toBe(readableDoc.filename)
      expect(updatedDoc.prefix).toBe('public')
      expect(updatedDoc.sizes.thumbnail.filename).toBe(readableDoc.sizes.thumbnail.filename)
      expect(updatedDoc.url).toBe(readableDoc.url)

      const fileResponse = await restClient.GET(
        `/${fileAccessMediaSlug}/file/${restrictedDoc.filename}`,
      )

      expect(fileResponse.status).toBe(403)
    })

    it('should reject invalid submitted filenames', async () => {
      const file = await getFileByPath(path.resolve(dirname, './image.png'))
      file!.name = `valid-${randomUUID()}.png`

      const doc = await payload.create({
        collection: fileAccessMediaSlug as CollectionSlug,
        data: { prefix: 'public', visibility: 'public' },
        file,
      })
      createdIDs.push(doc.id)

      const filenameResponse = await restClient.PATCH(`/${fileAccessMediaSlug}/${doc.id}`, {
        body: JSON.stringify({ filename: '../invalid.png' }),
      })
      expect(filenameResponse.status).toBe(400)

      const sizeFilenameResponse = await restClient.PATCH(`/${fileAccessMediaSlug}/${doc.id}`, {
        body: JSON.stringify({
          sizes: { thumbnail: { filename: '..\\invalid-thumbnail.png' } },
        }),
      })
      expect(sizeFilenameResponse.status).toBe(400)
    })

    it('should use stored file data when editing an image', async () => {
      const file = await getFileByPath(path.resolve(dirname, './image.png'))
      file!.name = `editable-${randomUUID()}.png`

      const doc = await payload.create({
        collection: fileAccessMediaSlug as CollectionSlug,
        data: { prefix: 'public', visibility: 'public' },
        file,
      })
      createdIDs.push(doc.id)

      const updateResponse = await restClient.PATCH(`/${fileAccessMediaSlug}/${doc.id}`, {
        body: JSON.stringify({ focalX: 75, focalY: 25 }),
      })
      expect(updateResponse.status).toBe(200)

      const updatedDoc = await payload.findByID({
        collection: fileAccessMediaSlug as CollectionSlug,
        id: doc.id,
      })

      expect(updatedDoc.filename).toBe(doc.filename)
      expect(updatedDoc.focalX).toBe(75)
      expect(updatedDoc.focalY).toBe(25)
      expect(updatedDoc.prefix).toBe('public')
      expect(updatedDoc.sizes.thumbnail.filename).toBe(doc.sizes.thumbnail.filename)
      expect(updatedDoc.url).toBe(doc.url)
    })

    it('should preserve each document file data during a bulk metadata update', async () => {
      const docs = await Promise.all(
        ['first', 'second'].map(async (name) => {
          const file = await getFileByPath(path.resolve(dirname, './image.png'))
          file!.name = `${name}-${randomUUID()}.png`

          const doc = await payload.create({
            collection: fileAccessMediaSlug as CollectionSlug,
            data: { prefix: name, visibility: 'public' },
            file,
          })
          createdIDs.push(doc.id)
          return doc
        }),
      )

      const updateResponse = await restClient.PATCH(`/${fileAccessMediaSlug}`, {
        body: JSON.stringify({
          filename: 'submitted.png',
          prefix: 'submitted',
          sizes: { thumbnail: { filename: 'submitted-thumbnail.png' } },
          url: '/api/file-access-media/file/submitted.png',
        }),
        query: { where: { id: { in: docs.map(({ id }) => id) } } },
      })
      expect(updateResponse.status).toBe(200)

      for (const doc of docs) {
        const updatedDoc = await payload.findByID({
          collection: fileAccessMediaSlug as CollectionSlug,
          id: doc.id,
        })

        expect(updatedDoc.filename).toBe(doc.filename)
        expect(updatedDoc.prefix).toBe(doc.prefix)
        expect(updatedDoc.requestMetadata).toContain('PATCH:application/json:')
        expect(updatedDoc.sizes.thumbnail.filename).toBe(doc.sizes.thumbnail.filename)
        expect(updatedDoc.url).toBe(doc.url)
      }
    })

    it('should replace and crop files independently during a bulk update', async () => {
      const docs = await Promise.all(
        ['first', 'second'].map(async (name) => {
          const file = await getFileByPath(path.resolve(dirname, './image.png'))
          file!.name = `${name}-${randomUUID()}.png`

          const doc = await payload.create({
            collection: fileAccessMediaSlug as CollectionSlug,
            data: { prefix: name, visibility: 'public' },
            file,
          })
          createdIDs.push(doc.id)
          return doc
        }),
      )
      const replacementPath = path.resolve(dirname, './test-image.png')
      const metadata = await payload.config.sharp(replacementPath).metadata()
      const height = Math.floor(metadata.height! / 2)
      const width = Math.floor(metadata.width! / 2)
      const { file, handle } = await createStreamableFile(replacementPath)
      const formData = new FormData()
      formData.append('_payload', JSON.stringify({ prefix: 'replacement' }))
      formData.append('file', file)

      const uploadConfig = payload.config.upload
      const originalUseTempFiles = uploadConfig.useTempFiles
      uploadConfig.useTempFiles = true

      try {
        const response = await restClient.PATCH(`/${fileAccessMediaSlug}`, {
          body: formData,
          file,
          query: {
            uploadEdits: {
              crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
              heightInPixels: height,
              widthInPixels: width,
            },
            where: { id: { in: docs.map(({ id }) => id) } },
          },
        })
        expect(response.status).toBe(200)

        const updatedDocs = await Promise.all(
          docs.map(({ id }) =>
            payload.findByID({ id, collection: fileAccessMediaSlug as CollectionSlug }),
          ),
        )
        expect(new Set(updatedDocs.map(({ filename }) => filename)).size).toBe(2)
        expect(updatedDocs.every(({ prefix }) => prefix === 'replacement')).toBe(true)

        const outputBuffers = await Promise.all(
          updatedDocs.map(({ filename }) => fs.promises.readFile(path.join(staticDir, filename))),
        )
        for (const output of outputBuffers) {
          await expect(payload.config.sharp(output).metadata()).resolves.toMatchObject({
            height,
            width,
          })
        }
        expect(outputBuffers[0]).toEqual(outputBuffers[1])
      } finally {
        uploadConfig.useTempFiles = originalUseTempFiles
        await handle.close()
      }
    })

    it('should replace a file while retaining its stored prefix', async () => {
      const file = await getFileByPath(path.resolve(dirname, './image.png'))
      file!.name = `replace-${randomUUID()}.png`

      const doc = await payload.create({
        collection: fileAccessMediaSlug as CollectionSlug,
        data: { prefix: 'public', visibility: 'public' },
        file,
      })
      createdIDs.push(doc.id)

      const { file: replacement, handle } = await createStreamableFile(
        path.resolve(dirname, './test-image.png'),
      )
      const formData = new FormData()
      formData.append('file', replacement)

      const updateResponse = await restClient.PATCH(`/${fileAccessMediaSlug}/${doc.id}`, {
        body: formData,
        file: replacement,
      })
      await handle.close()
      expect(updateResponse.status).toBe(200)

      const updatedDoc = await payload.findByID({
        collection: fileAccessMediaSlug as CollectionSlug,
        id: doc.id,
      })

      expect(updatedDoc.filename).not.toBe(doc.filename)
      expect(updatedDoc.prefix).toBe('public')
      expect(updatedDoc.sizes.thumbnail.filename).toBeTruthy()
    })

    it('should replace a file using its submitted prefix', async () => {
      const file = await getFileByPath(path.resolve(dirname, './image.png'))
      file!.name = `replace-prefix-${randomUUID()}.png`

      const doc = await payload.create({
        collection: fileAccessMediaSlug as CollectionSlug,
        data: { prefix: 'current', visibility: 'public' },
        file,
      })
      createdIDs.push(doc.id)

      const { file: replacement, handle } = await createStreamableFile(
        path.resolve(dirname, './test-image.png'),
      )
      const formData = new FormData()
      formData.append('_payload', JSON.stringify({ prefix: 'replacement' }))
      formData.append('file', replacement)

      const updateResponse = await restClient.PATCH(`/${fileAccessMediaSlug}/${doc.id}`, {
        body: formData,
        file: replacement,
      })
      await handle.close()
      expect(updateResponse.status).toBe(200)

      const updatedDoc = await payload.findByID({
        collection: fileAccessMediaSlug as CollectionSlug,
        id: doc.id,
      })

      expect(updatedDoc.filename).not.toBe(doc.filename)
      expect(updatedDoc.prefix).toBe('replacement')
      expect(updatedDoc.sizes.thumbnail.filename).toBeTruthy()
    })

    it('should retain current file data when restoring a version', async () => {
      const currentFile = await getFileByPath(path.resolve(dirname, './image.png'))
      currentFile!.name = `current-${randomUUID()}.png`
      const currentDoc = await payload.create({
        collection: fileAccessMediaSlug as CollectionSlug,
        data: { prefix: 'current', visibility: 'public' },
        file: currentFile,
      })
      createdIDs.push(currentDoc.id)

      const storedThumbnailURL = '/stored-thumbnail.png'
      await payload.db.updateOne({
        id: currentDoc.id,
        collection: fileAccessMediaSlug,
        data: { ...currentDoc, thumbnailURL: storedThumbnailURL },
      })

      const otherFile = await getFileByPath(path.resolve(dirname, './test-image.png'))
      otherFile!.name = `other-${randomUUID()}.png`
      const otherDoc = await payload.create({
        collection: fileAccessMediaSlug as CollectionSlug,
        data: { prefix: 'other', visibility: 'restricted' },
        file: otherFile,
      })
      createdIDs.push(otherDoc.id)

      const { docs: versions } = await payload.findVersions({
        collection: fileAccessMediaSlug as CollectionSlug,
        where: { parent: { equals: currentDoc.id } },
      })
      const version = versions[0]!

      await payload.db.updateVersion({
        id: version.id,
        collection: fileAccessMediaSlug,
        versionData: {
          ...version.version,
          filename: otherDoc.filename,
          filesize: 1,
          focalX: 1,
          focalY: 1,
          height: 1,
          mimeType: 'image/jpeg',
          prefix: { en: otherDoc.prefix, es: 'otro', fr: 'autre' },
          sizes: otherDoc.sizes,
          thumbnailURL: '/version-thumbnail.jpg',
          url: otherDoc.url,
          width: 1,
        },
      })

      const restoreResponse = await restClient.POST(
        `/${fileAccessMediaSlug}/versions/${version.id}`,
      )
      expect(restoreResponse.status).toBe(200)

      const restoredDoc = await payload.findByID({
        id: currentDoc.id,
        collection: fileAccessMediaSlug as CollectionSlug,
      })
      const restoredStoredDoc = await payload.db.findOne({
        collection: fileAccessMediaSlug,
        where: { id: { equals: currentDoc.id } },
      })

      expect(restoredDoc.filename).toBe(currentDoc.filename)
      expect(restoredDoc.filesize).toBe(currentDoc.filesize)
      expect(restoredDoc.focalX).toBe(currentDoc.focalX)
      expect(restoredDoc.focalY).toBe(currentDoc.focalY)
      expect(restoredDoc.height).toBe(currentDoc.height)
      expect(restoredDoc.mimeType).toBe(currentDoc.mimeType)
      expect(restoredDoc.prefix).toBe(currentDoc.prefix)
      const {
        _uuid: _currentSizesID,
        thumbnail: currentThumbnail,
        ...currentSizes
      } = currentDoc.sizes
      const { _uuid: _currentThumbnailID, ...currentThumbnailData } = currentThumbnail
      const {
        _uuid: _restoredSizesID,
        thumbnail: restoredThumbnail,
        ...restoredSizes
      } = restoredDoc.sizes
      const { _uuid: _restoredThumbnailID, ...restoredThumbnailData } = restoredThumbnail
      expect({ ...restoredSizes, thumbnail: restoredThumbnailData }).toEqual({
        ...currentSizes,
        thumbnail: currentThumbnailData,
      })
      expect(restoredDoc.thumbnailURL).toBe(currentDoc.thumbnailURL)
      expect(restoredDoc.url).toBe(currentDoc.url)
      expect(restoredDoc.width).toBe(currentDoc.width)
      expect(restoredStoredDoc.thumbnailURL).toBe(storedThumbnailURL)
    })
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

      it('creates from a remote source without reusing submitted file identity', async () => {
        const originalFile = await getFileByPath(path.resolve(dirname, './image.png'))
        originalFile!.name = `remote-source-${randomUUID()}.png`
        const originalBytes = Buffer.from(originalFile!.data)
        const createdIDs: (number | string)[] = []
        const originalDoc = await payload.create({
          collection: skipSafeFetchMediaSlug as CollectionSlug,
          data: {},
          file: originalFile,
        })
        createdIDs.push(originalDoc.id)

        const remoteBytes = await fs.promises.readFile(path.resolve(dirname, './test-image.png'))
        const sourceServer = createServer((_req, res) => {
          res.writeHead(200, {
            'Content-Length': remoteBytes.length,
            'Content-Type': 'image/png',
          })
          res.end(remoteBytes)
        })
        await new Promise((resolve) => sourceServer.listen(0, '127.0.0.1', resolve))
        const sourceURL = `http://127.0.0.1:${(sourceServer.address() as AddressInfo).port}/image.png`

        try {
          const response = await restClient.POST(`/${skipSafeFetchMediaSlug}`, {
            body: JSON.stringify({
              filename: originalDoc.filename,
              url: sourceURL,
            }),
          })
          expect(response.status).toBe(201)

          const { doc } = await response.json<{
            doc: { filename: string; id: number | string; url: string }
          }>()
          createdIDs.push(doc.id)

          expect(doc.filename).not.toBe(originalDoc.filename)
          expect(doc.url).not.toBe(sourceURL)
          await expect(
            fs.promises.readFile(path.resolve(dirname, './media', originalDoc.filename)),
          ).resolves.toEqual(originalBytes)
        } finally {
          await Promise.all(
            createdIDs.map((id) =>
              payload.delete({ collection: skipSafeFetchMediaSlug as CollectionSlug, id }),
            ),
          )
          await new Promise((resolve) => sourceServer.close(resolve))
        }
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
      it('should reject filenames with parent directory segments', async () => {
        const mediaDoc = (await payload.create({
          collection: mediaSlug,
          data: {},
          file: await getFileByPath(path.resolve(dirname, './image.png')),
        })) as unknown as Media

        const response = await restClient.PATCH(`/${mediaSlug}/${mediaDoc.id}`, {
          body: JSON.stringify({
            filename: `archive/../${mediaDoc.filename}`,
            sizes: {
              icon: {
                filename: `archive/../${mediaDoc.sizes.icon.filename}`,
              },
            },
          }),
        })

        expect(response.status).toBe(400)

        const unchangedDoc = (await payload.findByID({
          collection: mediaSlug,
          id: mediaDoc.id,
        })) as unknown as Media

        expect(unchangedDoc.filename).toBe(mediaDoc.filename)
        expect(unchangedDoc.sizes.icon.filename).toBe(mediaDoc.sizes.icon.filename)

        await payload.delete({ collection: mediaSlug, id: mediaDoc.id })
      })

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
      it('should serve files with hash characters in filename', async () => {
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
      })

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

      it('should create documents for JPEG XL files, which sharp cannot decode', async () => {
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

      it('should not crash when adminThumbnail size is not generated', async () => {
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

    describe('update', () => {
      it('should reprocess the existing file when upload metadata changes', async () => {
        const sourceFile = await getFileByPath(path.resolve(dirname, './small.png'))
        const targetFile = await getFileByPath(path.resolve(dirname, './image.png'))
        const uniqueID = randomUUID()
        sourceFile.name = `source-${uniqueID}.png`
        targetFile.name = `target-${uniqueID}.png`

        const sourceDoc = await payload.create({
          collection: mediaSlug,
          data: {},
          file: sourceFile,
        })
        const targetDoc = await payload.create({
          collection: mediaSlug,
          data: {},
          file: targetFile,
        })
        const targetPath = path.join(dirname, './media', targetDoc.filename)
        const targetContents = await fs.promises.readFile(targetPath)

        try {
          const response = await restClient.PATCH(`/${mediaSlug}/${sourceDoc.id}`, {
            body: JSON.stringify({
              filename: targetDoc.filename,
              url: targetDoc.url,
            }),
            query: {
              uploadEdits: {
                crop: {
                  height: 50,
                  unit: '%',
                  width: 50,
                  x: 0,
                  y: 0,
                },
                heightInPixels: 40,
                widthInPixels: 40,
              },
            },
          })
          const { doc } = await response.json()

          expect((await fs.promises.readFile(targetPath)).equals(targetContents)).toBe(true)
          expect(response.status).toBe(200)
          expect(doc.filename).toBe(sourceDoc.filename)
        } finally {
          await payload.delete({ collection: mediaSlug, id: sourceDoc.id })
          await payload.delete({ collection: mediaSlug, id: targetDoc.id })
        }
      })

      it('should reprocess existing files during a where-based update', async () => {
        const sourceFile = await getFileByPath(path.resolve(dirname, './image.png'))
        sourceFile.name = `where-update-${randomUUID()}.png`

        const sourceDoc = await payload.create({
          collection: mediaSlug,
          data: {},
          file: sourceFile,
        })
        const sourcePath = path.join(dirname, './media', sourceDoc.filename)

        try {
          const response = await restClient.PATCH(`/${mediaSlug}`, {
            body: JSON.stringify({}),
            query: {
              uploadEdits: {
                crop: {
                  height: 50,
                  unit: '%',
                  width: 50,
                  x: 0,
                  y: 0,
                },
                heightInPixels: 40,
                widthInPixels: 40,
              },
              where: {
                id: {
                  equals: sourceDoc.id,
                },
              },
            },
          })
          const metadata = await payload.config.sharp(sourcePath).metadata()

          expect(response.status).toBe(200)
          expect(metadata).toMatchObject({ height: 40, width: 40 })
        } finally {
          await payload.delete({ collection: mediaSlug, id: sourceDoc.id })
        }
      })

      it('should isolate upload state for each document in a where-based update', async () => {
        const observationValue = `request-state-${randomUUID()}`
        const collectionHooks = payload.collections[mediaSlug].config.hooks
        const originalBeforeChange = collectionHooks.beforeChange
        const createdDocIDs: Media['id'][] = []
        const observedStates: Array<{
          documentFilename: string
          requestFilename: string | undefined
          uploadSizes: Record<string, Buffer> | undefined
        }> = []
        let resolveHooksStarted!: () => void
        const hooksStarted = new Promise<void>((resolve) => {
          resolveHooksStarted = resolve
        })
        let startedHookCount = 0
        // Adapters that wrap each document in its own transaction process bulk updates one at a
        // time, so holding the first hook until a second one starts would deadlock there.
        const processesDocumentsInParallel = !payload.db.bulkOperationsSingleTransaction

        collectionHooks.beforeChange = [
          ...(originalBeforeChange ?? []),
          async ({ data, operation, originalDoc, req }) => {
            if (operation !== 'update' || data.alt !== observationValue) {
              return data
            }

            startedHookCount += 1
            if (startedHookCount === 2) {
              resolveHooksStarted()
            }
            if (processesDocumentsInParallel) {
              await hooksStarted
            }
            observedStates.push({
              documentFilename: originalDoc.filename,
              requestFilename: req.file?.name,
              uploadSizes: req.payloadUploadSizes,
            })
            return data
          },
        ]

        try {
          const docs = await Promise.all(
            ['./small.png', './image.png'].map(async (filePath) => {
              const file = await getFileByPath(path.resolve(dirname, filePath))
              file.name = `request-state-${randomUUID()}.png`
              const doc = await payload.create({
                collection: mediaSlug,
                data: {},
                file,
              })
              createdDocIDs.push(doc.id)
              return doc
            }),
          )

          const result = await payload.update({
            collection: mediaSlug,
            data: {
              alt: observationValue,
            },
            req: {
              query: {
                uploadEdits: {
                  crop: {
                    height: 50,
                    unit: '%',
                    width: 50,
                    x: 0,
                    y: 0,
                  },
                  heightInPixels: 40,
                  widthInPixels: 40,
                },
              },
            },
            where: {
              id: {
                in: docs.map(({ id }) => id),
              },
            },
          })

          expect(result.errors).toEqual([])
          expect(result.docs).toHaveLength(2)
          expect(observedStates).toHaveLength(2)
          for (const state of observedStates) {
            expect(state.requestFilename).toBe(state.documentFilename)
            expect(Object.keys(state.uploadSizes ?? {})).toContain('icon')
          }
          expect(observedStates[0]?.uploadSizes).not.toBe(observedStates[1]?.uploadSizes)
        } finally {
          collectionHooks.beforeChange = originalBeforeChange
          await Promise.all(
            createdDocIDs.map((id) => payload.delete({ collection: mediaSlug, id })),
          )
        }
      })

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

      it('should resolve relative URLs against the configured server origin', async () => {
        const testCookies = ['payload-token=123', 'other-cookie=456', 'payload-something=789'].join(
          '; ',
        )
        const configuredRequests: string[] = []
        const alternateRequests: string[] = []

        const configuredServer = createServer((req, res) => {
          configuredRequests.push(req.headers.cookie ?? '')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        })
        const alternateServer = createServer((req, res) => {
          alternateRequests.push(req.headers.cookie ?? '')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        })
        await new Promise((res) => configuredServer.listen(0, undefined, undefined, res))
        await new Promise((res) => alternateServer.listen(0, undefined, undefined, res))

        const configuredPort = (configuredServer.address() as AddressInfo).port
        const alternatePort = (alternateServer.address() as AddressInfo).port
        const configuredOrigin = `http://localhost:${configuredPort}`
        const alternateOrigin = `http://localhost:${alternatePort}`

        const req = await createPayloadRequest({
          config: payload.config,
          request: new Request(configuredOrigin, {
            headers: new Headers({
              cookie: testCookies,
              host: `localhost:${alternatePort}`,
              origin: alternateOrigin,
            }),
          }),
        })
        const originalServerURL = req.payload.config.serverURL
        req.payload.config.serverURL = configuredOrigin

        try {
          await getExternalFile({
            data: { url: '/api/media/image.png' },
            req,
            uploadConfig: { skipSafeFetch: true },
          })

          expect(configuredRequests).toHaveLength(1)
          expect(alternateRequests).toHaveLength(0)
          expect(configuredRequests[0]).toContain('payload-token=123')
          expect(configuredRequests[0]).toContain('payload-something=789')
          expect(configuredRequests[0]).toContain('other-cookie=456')
        } finally {
          req.payload.config.serverURL = originalServerURL
          await new Promise((res) => configuredServer.close(res))
          await new Promise((res) => alternateServer.close(res))
        }
      })

      it('should apply request origin policy to relative URLs', async () => {
        const receivedCookies: string[] = []
        const server = createServer((req, res) => {
          receivedCookies.push(req.headers.cookie ?? '')
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        })
        await new Promise((res) => server.listen(0, undefined, undefined, res))

        const port = (server.address() as AddressInfo).port
        const requestOrigin = `http://localhost:${port}`
        const req = await createPayloadRequest({
          config: payload.config,
          request: new Request(requestOrigin, {
            headers: new Headers({
              cookie: 'payload-token=123; other-cookie=456',
              host: `localhost:${port}`,
              origin: requestOrigin,
            }),
          }),
        })
        const originalCORS = req.payload.config.cors
        const originalCSRF = req.payload.config.csrf
        const originalServerURL = req.payload.config.serverURL
        req.payload.config.cors = []
        req.payload.config.csrf = []
        req.payload.config.serverURL = ''

        try {
          await getExternalFile({
            data: { url: '/api/media/image.png' },
            req,
            uploadConfig: { skipSafeFetch: true },
          })

          expect(receivedCookies).toEqual(['other-cookie=456'])

          req.payload.config.csrf = [requestOrigin]
          await getExternalFile({
            data: { url: '/api/media/image.png' },
            req,
            uploadConfig: { skipSafeFetch: true },
          })

          expect(receivedCookies).toEqual([
            'other-cookie=456',
            'payload-token=123; other-cookie=456',
          ])
        } finally {
          req.payload.config.cors = originalCORS
          req.payload.config.csrf = originalCSRF
          req.payload.config.serverURL = originalServerURL
          await new Promise((res) => server.close(res))
        }
      })

      it('should filter authentication cookies after a cross-origin redirect', async () => {
        const testCookies = ['payload-token=123', 'other-cookie=456', 'payload-something=789'].join(
          '; ',
        )
        let redirectedCookie = ''
        const configuredCookies: string[] = []

        const redirectedServer = createServer((req, res) => {
          redirectedCookie = req.headers.cookie ?? ''
          res.writeHead(302, { Location: `${configuredOrigin}/image.png` })
          res.end()
        })
        await new Promise((res) => redirectedServer.listen(0, undefined, undefined, res))
        const redirectedPort = (redirectedServer.address() as AddressInfo).port

        const configuredServer = createServer((req, res) => {
          configuredCookies.push(req.headers.cookie ?? '')
          if (req.url === '/api/media/image.png') {
            res.writeHead(302, { Location: `http://localhost:${redirectedPort}/image.png` })
            res.end()
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          }
        })
        await new Promise((res) => configuredServer.listen(0, undefined, undefined, res))
        const configuredPort = (configuredServer.address() as AddressInfo).port
        const configuredOrigin = `http://localhost:${configuredPort}`

        const req = await createPayloadRequest({
          config: payload.config,
          request: new Request(configuredOrigin, {
            headers: new Headers({ cookie: testCookies, origin: configuredOrigin }),
          }),
        })
        const originalServerURL = req.payload.config.serverURL
        req.payload.config.serverURL = configuredOrigin

        try {
          await getExternalFile({
            data: { url: '/api/media/image.png' },
            req,
            uploadConfig: { skipSafeFetch: true },
          })

          expect(redirectedCookie).not.toContain('payload-token=123')
          expect(redirectedCookie).not.toContain('payload-something=789')
          expect(redirectedCookie).toContain('other-cookie=456')
          expect(configuredCookies).toHaveLength(2)
          expect(configuredCookies[1]).toContain('payload-token=123')
          expect(configuredCookies[1]).toContain('payload-something=789')
        } finally {
          req.payload.config.serverURL = originalServerURL
          await new Promise((res) => configuredServer.close(res))
          await new Promise((res) => redirectedServer.close(res))
        }
      })

      it.each([
        {
          expectedURL: 'http://files.example.com/image.png',
          receivesPayloadCookies: false,
          url: 'HTTP://files.example.com/image.png',
        },
        {
          expectedURL: 'https://app.example.com/image.png?size=large#preview',
          receivesPayloadCookies: true,
          url: '/image.png?size=large#preview',
        },
        {
          expectedURL: 'https://app.example.com/assets/image.png',
          receivesPayloadCookies: true,
          url: 'assets/image.png',
        },
        {
          expectedURL: 'https://files.example.com/image.png',
          receivesPayloadCookies: false,
          url: '//files.example.com/image.png',
        },
      ])(
        'should normalize supported file URL $url',
        async ({ expectedURL, receivesPayloadCookies, url }) => {
          const fetchSpy = vitest.spyOn(global, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
              headers: { 'Content-Type': 'application/json' },
              status: 200,
            }),
          )
          const req = await createPayloadRequest({
            config: payload.config,
            request: new Request('https://app.example.com', {
              headers: new Headers({ cookie: 'payload-token=123; other-cookie=456' }),
            }),
          })
          const originalServerURL = req.payload.config.serverURL
          req.payload.config.serverURL = 'https://app.example.com/base'

          try {
            await getExternalFile({
              data: { url },
              req,
              uploadConfig: { skipSafeFetch: true },
            })

            const [[requestedURL, options]] = fetchSpy.mock.calls
            const cookieHeader = options.headers.cookie
            expect(requestedURL).toBe(expectedURL)
            expect(cookieHeader.includes('payload-token=123')).toBe(receivesPayloadCookies)
            expect(cookieHeader).toContain('other-cookie=456')
          } finally {
            req.payload.config.serverURL = originalServerURL
            fetchSpy.mockRestore()
          }
        },
      )

      it.each(['http://[', 'ftp://files.example.com/image.png', 'data:text/plain,image'])(
        'should reject unsupported file URL %s',
        async (url) => {
          const req = await createPayloadRequest({
            config: payload.config,
            request: new Request('https://app.example.com'),
          })

          await expect(
            getExternalFile({
              data: { url },
              req,
              uploadConfig: { skipSafeFetch: true },
            }),
          ).rejects.toMatchObject({ status: 400 })
        },
      )

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

      it('should provide each request destination to the external file header filter', async () => {
        const destinations: Array<{ isSameOrigin: boolean; url: string }> = []
        let redirectedCookie = ''
        const redirectedServer = createServer((req, res) => {
          redirectedCookie = req.headers.cookie ?? ''
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        })
        await new Promise((res) => redirectedServer.listen(0, undefined, undefined, res))
        const redirectedOrigin = `http://localhost:${(redirectedServer.address() as AddressInfo).port}`

        const configuredServer = createServer((_req, res) => {
          res.writeHead(302, { Location: `${redirectedOrigin}/image.png` })
          res.end()
        })
        await new Promise((res) => configuredServer.listen(0, undefined, undefined, res))
        const configuredOrigin = `http://localhost:${(configuredServer.address() as AddressInfo).port}`
        const req = await createPayloadRequest({
          config: payload.config,
          request: new Request(configuredOrigin, {
            headers: new Headers({ cookie: 'payload-token=123; other-cookie=456' }),
          }),
        })
        const originalServerURL = req.payload.config.serverURL
        req.payload.config.serverURL = configuredOrigin

        try {
          await getExternalFile({
            data: { url: '/api/media/image.png' },
            req,
            uploadConfig: {
              externalFileHeaderFilter: (headers, context) => {
                destinations.push(context!)
                return headers
              },
              skipSafeFetch: true,
            },
          })

          expect(destinations).toEqual([
            { isSameOrigin: true, url: `${configuredOrigin}/api/media/image.png` },
            { isSameOrigin: false, url: `${redirectedOrigin}/image.png` },
          ])
          expect(redirectedCookie).toContain('payload-token=123')
        } finally {
          req.payload.config.serverURL = originalServerURL
          await new Promise((res) => configuredServer.close(res))
          await new Promise((res) => redirectedServer.close(res))
        }
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

      describe('useTempFiles MIME type bypass', () => {
        const createdTmpFiles: string[] = []

        const mockReq = {
          payload: {
            config: { upload: { useTempFiles: true } },
            logger: { warn: () => {}, error: () => {} },
          },
        } as unknown as PayloadRequest

        afterEach(async () => {
          for (const tmpFile of createdTmpFiles) {
            try {
              await fs.promises.unlink(tmpFile)
            } catch {
              // ignore cleanup errors
            }
          }
          createdTmpFiles.length = 0
        })

        it('should not bypass mimeTypes restriction when useTempFiles is enabled and file is HTML', async () => {
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

        it('should not bypass SVG content validation when useTempFiles is enabled', async () => {
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

        it('should allow a valid image file when useTempFiles is enabled', async () => {
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

        it('should throw ValidationError when tempFilePath is missing and file.data is empty', async () => {
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

        it('should reject an invalid PDF when useTempFiles is enabled', async () => {
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

    it('should not leak req.file between sequential duplicate() calls on a shared req', async () => {
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

  describe('Upload content responses', () => {
    let svgDoc: Media
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

    it('should serve SVG files with a restrictive content policy', async () => {
      const filePath = path.resolve(dirname, './image.svg')
      const file = await getFileByPath(filePath)

      svgDoc = (await payload.create({
        collection: noRestrictFileTypesSlug as CollectionSlug,
        data: {},
        file,
      })) as unknown as Media

      docIDs.push(svgDoc.id)

      const response = await restClient.GET(`/${noRestrictFileTypesSlug}/file/${svgDoc.filename}`)

      expect(response.status).toBe(200)

      const cspHeader = response.headers.get('Content-Security-Policy')
      expect(cspHeader).toBe("script-src 'none'; frame-src 'none'; object-src 'none'")
    })

    it('should serve all SVG files with CSP headers regardless of content', async () => {
      const filePath = path.resolve(dirname, './image.svg')
      const file = await getFileByPath(filePath)

      const safeDoc = (await payload.create({
        collection: svgOnlySlug as CollectionSlug,
        data: {},
        file,
      })) as unknown as Media

      docIDs.push(safeDoc.id)

      const response = await restClient.GET(`/${svgOnlySlug}/file/${safeDoc.filename}`)

      expect(response.status).toBe(200)

      const cspHeader = response.headers.get('Content-Security-Policy')
      expect(cspHeader).toBe("script-src 'none'; frame-src 'none'; object-src 'none'")
    })

    it('should serve XML files with a restrictive content policy', async () => {
      const data = Buffer.from(
        '<?xml version="1.0"?><?xml-stylesheet type="text/xsl" href="/api/media/file/theme.xsl"?><document><title>Reference</title></document>',
      )
      const xmlDoc = (await payload.create({
        collection: noRestrictFileTypesSlug as CollectionSlug,
        data: {},
        file: {
          name: 'reference.xml',
          data,
          mimetype: 'application/xml',
          size: data.length,
        },
      })) as unknown as Media

      docIDs.push(xmlDoc.id)

      const response = await restClient.GET(`/${noRestrictFileTypesSlug}/file/${xmlDoc.filename}`)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/xml')
      expect(response.headers.get('Content-Security-Policy')).toBe(
        "script-src 'none'; frame-src 'none'; object-src 'none'",
      )
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

    it('should enforce allowList on redirect targets', async () => {
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

    it('should not allow infinite redirect loops', async () => {
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

  describe('paste-url endpoint', () => {
    it('should return 400 when pasteURL is not configured', async () => {
      const response = await restClient.GET(`/${mediaSlug}/paste-url`, {
        query: { src: 'http://example.com/file.png' },
      })
      expect(response.status).toBe(400)
    })

    it('should return 400 when pasteURL is disabled', async () => {
      const response = await restClient.GET(`/${focalNoSizesSlug}/paste-url`, {
        query: { src: 'http://example.com/file.png' },
      })
      expect(response.status).toBe(400)
    })

    it('should reject requests to non-public addresses', async () => {
      const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`, {
        query: { src: 'http://127.0.0.1/file.png' },
      })
      expect(response.status).toBe(500)
    })

    it('should validate resolved addresses', async () => {
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

    it('should reject URLs not matching the allowList', async () => {
      const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`, {
        query: { src: 'http://other.example.com/file.png' },
      })
      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`, {
        query: { src: 'http://127.0.0.1/file.png' },
        auth: false,
      })
      expect(response.status).toBe(403)
    })

    it('should require a src query parameter', async () => {
      const response = await restClient.GET(`/${allowListMediaSlug}/paste-url`)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('tempFileDir', () => {
    it.each([
      { dir: '/tmp', expectedPrefix: '/tmp', description: 'absolute path like /tmp' },
      { dir: 'tmp', expectedPrefix: path.join(process.cwd(), 'tmp'), description: 'relative path' },
    ])(
      'creates temp files in correct location for $description',
      async ({ dir, expectedPrefix }) => {
        const handler = tempFileHandler({ tempFileDir: dir }, 'field', 'file.png')
        const filePath = handler.getFilePath()

        expect(filePath.startsWith(expectedPrefix)).toBe(true)
        await handler.cleanup()
      },
    )
  })

  describe('prefix query parameter', () => {
    const docIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of docIDs) {
        try {
          await payload.delete({ collection: prefixMediaSlug, id })
        } catch {
          // noop — file may already have been deleted
        }
      }
      docIDs.length = 0
    })

    it('should return 200 when the prefix query param matches the stored document prefix', async () => {
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

    it('should return 403 when the prefix query param does not match the stored document prefix', async () => {
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

    it('should return 200 without prefix param for documents that have no prefix (backward compatibility)', async () => {
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

    it('should return 403 when prefix param is provided but no document has a matching prefix', async () => {
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

  describe('temp file cleanup when an operation fails', () => {
    const createdIDs: (number | string)[] = []
    const createdTmpFiles: string[] = []
    let originalUploadConfig: typeof payload.config.upload

    beforeAll(() => {
      originalUploadConfig = payload.config.upload
      payload.config.upload = { ...payload.config.upload, useTempFiles: true }
    })

    afterAll(() => {
      payload.config.upload = originalUploadConfig
    })

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ collection: bulkUploadsHookErrorSlug as CollectionSlug, id })
      }
      createdIDs.length = 0

      for (const tmpFile of createdTmpFiles) {
        await fs.promises.unlink(tmpFile).catch(() => undefined)
      }
      createdTmpFiles.length = 0
    })

    const createTempFileCopy = async () => {
      const pngData = await fs.promises.readFile(path.resolve(dirname, './image.png'))
      const tmpFile = path.join(os.tmpdir(), `payload-test-${randomUUID()}.png`)
      createdTmpFiles.push(tmpFile)
      await fs.promises.writeFile(tmpFile, pngData)
      return { size: pngData.length, tmpFile }
    }

    it('removes the temp file when a beforeChange hook throws during create', async () => {
      const { size, tmpFile } = await createTempFileCopy()

      await expect(
        payload.create({
          collection: bulkUploadsHookErrorSlug as CollectionSlug,
          data: { shouldFail: true },
          file: {
            data: Buffer.alloc(0),
            mimetype: 'image/png',
            name: 'temp-cleanup-create.png',
            size,
            tempFilePath: tmpFile,
          },
        }),
      ).rejects.toThrow()

      expect(await fileExists(tmpFile)).toBe(false)
    })

    it('removes the temp file when a beforeChange hook throws during update', async () => {
      const initial = await createTempFileCopy()

      const doc = await payload.create({
        collection: bulkUploadsHookErrorSlug as CollectionSlug,
        data: { shouldFail: false },
        file: {
          data: Buffer.alloc(0),
          mimetype: 'image/png',
          name: 'temp-cleanup-update-initial.png',
          size: initial.size,
          tempFilePath: initial.tmpFile,
        },
      })
      createdIDs.push(doc.id)

      const { size, tmpFile } = await createTempFileCopy()

      await expect(
        payload.update({
          collection: bulkUploadsHookErrorSlug as CollectionSlug,
          id: doc.id,
          data: { shouldFail: true },
          file: {
            data: Buffer.alloc(0),
            mimetype: 'image/png',
            name: 'temp-cleanup-update.png',
            size,
            tempFilePath: tmpFile,
          },
        }),
      ).rejects.toThrow()

      expect(await fileExists(tmpFile)).toBe(false)
    })
  })

  /**
   * A bulk update runs `generateFileData` once and hands the resulting `filesToUpload` to the
   * per-document promises, so the temp file it copies from has to outlive those writes.
   */
  describe('temp file copy during a bulk update', () => {
    const createdIDs: (number | string)[] = []
    const tempFilesToClean: string[] = []
    let originalUploadConfig: typeof payload.config.upload

    beforeAll(() => {
      originalUploadConfig = payload.config.upload
      payload.config.upload = { ...payload.config.upload, useTempFiles: true }
    })

    afterAll(() => {
      payload.config.upload = originalUploadConfig
    })

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: mediaSlug })
      }
      createdIDs.length = 0

      for (const tempFilePath of tempFilesToClean) {
        await fs.promises.rm(tempFilePath, { force: true })
      }
      tempFilesToClean.length = 0
    })

    it('copies the temp file before removing it', async () => {
      const alt = `bulk-temp-file-${randomUUID()}`

      const existingDoc = await payload.create({
        collection: mediaSlug,
        data: { alt },
        file: {
          name: `bulk-temp-file-initial-${randomUUID()}.mp3`,
          data: Buffer.from('initial-audio-bytes'),
          mimetype: 'audio/mpeg',
          size: 19,
        },
      })

      createdIDs.push(existingDoc.id)

      const fileContents = Buffer.from(`bulk-audio-bytes-${randomUUID()}`)
      const tempFilePath = path.join(os.tmpdir(), `payload-test-bulk-temp-${randomUUID()}.mp3`)

      await fs.promises.writeFile(tempFilePath, fileContents)
      tempFilesToClean.push(tempFilePath)

      const result = await payload.update({
        collection: mediaSlug,
        data: { alt },
        file: {
          name: `bulk-temp-file-${randomUUID()}.mp3`,
          data: Buffer.alloc(0),
          mimetype: 'audio/mpeg',
          size: fileContents.length,
          tempFilePath,
        },
        where: { alt: { equals: alt } },
      })

      expect(result.errors).toEqual([])
      expect(result.docs).toHaveLength(1)

      const savedFilePath = path.join(dirname, './media', result.docs[0]!.filename!)

      expect(await fileExists(savedFilePath)).toBe(true)
      expect(await fs.promises.readFile(savedFilePath)).toEqual(fileContents)

      expect(await fileExists(tempFilePath)).toBe(false)
    })
  })

  /**
   * When local storage is enabled and no image processing changes the bytes, generateFileData
   * copies straight from `file.tempFilePath` to its destination instead of reading the whole
   * file into memory (see generateFileData.ts). `mediaSlug` has no restrictions on non-image
   * mime types, so an audio file uploaded there skips all sharp processing and exercises that
   * copy against real disk I/O.
   */
  describe('temp file copy to local storage', () => {
    const createdIDs: (number | string)[] = []
    const tempFilesToClean: string[] = []

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: mediaSlug })
      }
      createdIDs.length = 0

      for (const tempFilePath of tempFilesToClean) {
        await fs.promises.rm(tempFilePath, { force: true })
      }
      tempFilesToClean.length = 0
    })

    it('copies the temp file to its destination instead of reading it into memory', async () => {
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

      createdIDs.push(doc.id)

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

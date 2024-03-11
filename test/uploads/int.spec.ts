import { File as FileBuffer } from 'buffer'
import NodeFormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

import type { Payload } from '../../packages/payload/src/index.js'
import type { Enlarge, Media } from './payload-types.js'

import { getPayload } from '../../packages/payload/src/index.js'
import getFileByPath from '../../packages/payload/src/uploads/getFileByPath.js'
import { NextRESTClient } from '../helpers/NextRESTClient.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise from './config.js'
import {
  enlargeSlug,
  mediaSlug,
  reduceSlug,
  relationSlug,
  unstoredMediaSlug,
  usersSlug,
} from './shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const getMimeType = (
  filePath: string,
): {
  filename: string
  type: string
} => {
  const ext = path.extname(filePath).slice(1)
  let type: string
  switch (ext) {
    case 'png':
      type = 'image/png'
      break
    case 'jpg':
      type = 'image/jpeg'
      break
    case 'jpeg':
      type = 'image/jpeg'
      break
    case 'svg':
      type = 'image/svg+xml'
      break
    default:
      type = 'image/png'
  }

  return {
    filename: path.basename(filePath),
    type,
  }
}
const bufferToFileBlob = async (filePath: string): Promise<File> =>
  new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error reading file at ${filePath}:`, err)
        reject(err)
        return
      }

      const { filename, type } = getMimeType(filePath)

      // Convert type FileBuffer > unknown > File
      // The File type expects webkitRelativePath, we don't have that
      resolve(new FileBuffer([data], filename, { type }) as unknown as File)
    })
  })

const stat = promisify(fs.stat)

let restClient: NextRESTClient
let payload: Payload

describe('Collections - Uploads', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
    restClient = new NextRESTClient(payload.config)
    await restClient.login({ slug: usersSlug })
  })

  describe('REST', () => {
    describe('create', () => {
      it('creates from form data given a png', async () => {
        const formData = new FormData()
        const filePath = path.join(dirname, './image.png')

        formData.append('file', await bufferToFileBlob(filePath))

        const response = await restClient.POST(`/${mediaSlug}`, {
          body: formData,
          file: true,
        })
        const { doc } = await response.json()

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
        expect(sizes.maintainedAspectRatio.url).toContain('/api/media/file/image')
        expect(sizes.maintainedAspectRatio.url).toContain('.png')
        expect(sizes.maintainedAspectRatio.width).toEqual(1024)
        expect(sizes.maintainedAspectRatio.height).toEqual(1024)
        expect(sizes).toHaveProperty('tablet')
        expect(sizes).toHaveProperty('mobile')
        expect(sizes).toHaveProperty('icon')
      })

      it('creates from form data given an svg', async () => {
        const formData = new FormData()
        const filePath = path.join(dirname, './image.svg')
        formData.append('file', await bufferToFileBlob(filePath))

        const response = await restClient.POST(`/${mediaSlug}`, {
          body: formData,
          file: true,
        })
        const { doc } = await response.json()

        expect(response.status).toBe(201)

        // Check for files
        expect(await fileExists(path.join(dirname, './media', doc.filename))).toBe(true)

        // Check api response
        expect(doc.mimeType).toEqual('image/svg+xml')
        expect(doc.sizes.maintainedAspectRatio.url).toBeFalsy()
        expect(doc.width).toBeDefined()
        expect(doc.height).toBeDefined()
      })
    })

    it('should have valid image url', async () => {
      const formData = new FormData()
      const fileBlob = await bufferToFileBlob(path.join(dirname, './image.svg'))
      formData.append('file', fileBlob)

      const response = await restClient.POST(`/${mediaSlug}`, {
        body: formData,
        file: true,
      })
      const { doc } = await response.json()

      expect(response.status).toBe(201)
      const expectedPath = path.join(dirname, './media')
      expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)

      expect(doc.url).not.toContain('undefined')
    })

    it('creates images that do not require all sizes', async () => {
      const formData = new FormData()
      const fileBlob = await bufferToFileBlob(path.join(dirname, './small.png'))
      formData.append('file', fileBlob)

      const response = await restClient.POST(`/${mediaSlug}`, {
        body: formData,
        file: true,
      })
      const { doc } = await response.json()

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

    it('creates images from a different format', async () => {
      const formData = new FormData()
      const fileBlob = await bufferToFileBlob(path.join(dirname, './image.jpg'))
      formData.append('file', fileBlob)

      const response = await restClient.POST(`/${mediaSlug}`, {
        body: formData,
        file: true,
      })
      const { doc } = await response.json()

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
      const fileBlob = await bufferToFileBlob(path.join(dirname, './unstored.png'))
      formData.append('file', fileBlob)

      // unstored media
      const response = await restClient.POST(`/${unstoredMediaSlug}`, {
        body: formData,
        file: true,
      })
      const { doc } = await response.json()

      expect(response.status).toBe(201)

      // Check for files
      expect(await fileExists(path.join(dirname, './media', doc.filename))).toBe(false)

      // Check api response
      expect(doc.filename).toBeDefined()
    })

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
      const formData = new NodeFormData()
      formData.append('file', fs.createReadStream(path.join(dirname, './small.png')))
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
  })

  it('update', async () => {
    // Create image
    const filePath = path.resolve(dirname, './image.png')
    const file = await getFileByPath(filePath)
    file.name = 'renamed.png'

    const mediaDoc = (await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })) as unknown as Media

    const formData = new FormData()
    formData.append('file', await bufferToFileBlob(path.join(dirname, './small.png')))

    const response = await restClient.PATCH(`/${mediaSlug}/${mediaDoc.id}`, {
      body: formData,
      file: true,
    })

    expect(response.status).toBe(200)

    const expectedPath = path.join(dirname, './media')

    // Check that previously existing files were removed
    expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(false)
    expect(await fileExists(path.join(expectedPath, mediaDoc.sizes.icon.filename))).toBe(false)
  })

  it('update - update many', async () => {
    // Create image
    const filePath = path.resolve(dirname, './image.png')
    const file = await getFileByPath(filePath)
    file.name = 'renamed.png'

    const mediaDoc = (await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })) as unknown as Media

    const formData = new FormData()
    formData.append('file', await bufferToFileBlob(path.join(dirname, './small.png')))

    const response = await restClient.PATCH(`/${mediaSlug}`, {
      body: formData,
      file: true,
      query: {
        where: {
          id: {
            equals: mediaDoc.id,
          },
        },
      },
    })

    expect(response.status).toBe(200)

    const expectedPath = path.join(dirname, './media')

    // Check that previously existing files were removed
    expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(false)
    expect(await fileExists(path.join(expectedPath, mediaDoc.sizes.icon.filename))).toBe(false)
  })

  it('should remove existing media on re-upload', async () => {
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

  it('should remove existing media on re-upload - update many', async () => {
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
    expect(await fileExists(path.join(expectedPath, updatedMediaDoc.docs[0].filename))).toBe(true)
    expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(false)
  })

  it('should remove extra sizes on update', async () => {
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

  it('should remove extra sizes on update - update many', async () => {
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

  it('should allow update removing a relationship', async () => {
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

  it('should allow update removing a relationship - update many', async () => {
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

  it('delete', async () => {
    const formData = new FormData()
    formData.append('file', await bufferToFileBlob(path.join(dirname, './image.png')))

    const { doc } = await restClient
      .POST(`/${mediaSlug}`, {
        body: formData,
        file: true,
      })
      .then((res) => res.json())

    const response2 = await restClient.DELETE(`/${mediaSlug}/${doc.id}`)
    expect(response2.status).toBe(200)

    expect(await fileExists(path.join(dirname, doc.filename))).toBe(false)
  })

  it('delete - update many', async () => {
    const formData = new FormData()
    formData.append('file', await bufferToFileBlob(path.join(dirname, './image.png')))

    const { doc } = await restClient
      .POST(`/${mediaSlug}`, {
        body: formData,
        file: true,
      })
      .then((res) => res.json())

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

  describe('filesRequiredOnCreate', () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    it('should allow file to be optional if filesRequiredOnCreate is false', async () => {
      expect(
        async () =>
          await payload.create({
            // @ts-expect-error
            collection: 'optional-file',
            data: {},
          }),
      ).not.toThrow()
    })

    it('should throw an error if no file and filesRequiredOnCreate is true', async () => {
      await expect(async () =>
        payload.create({
          // @ts-expect-error
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
})

async function fileExists(fileName: string): Promise<boolean> {
  try {
    await stat(fileName)
    return true
  } catch (err) {
    return false
  }
}

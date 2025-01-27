import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import type { Enlarge, Media } from './payload-types'

import payload from '../../packages/payload/src'
import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import configPromise from './config'
import { enlargeSlug, focalOnlySlug, mediaSlug, reduceSlug, relationSlug } from './shared'

const stat = promisify(fs.stat)

require('isomorphic-fetch')

describe('Collections - Uploads', () => {
  let client: RESTClient

  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } })
    const config = await configPromise
    client = new RESTClient(config, { serverURL, defaultSlug: mediaSlug })
    await client.login()
  })

  describe('REST', () => {
    describe('create', () => {
      it('creates from form data given a png', async () => {
        const formData = new FormData()
        formData.append('file', fs.createReadStream(path.join(__dirname, './image.png')))

        const { status, doc } = await client.create({
          file: true,
          data: formData,
        })

        expect(status).toBe(201)

        const { sizes } = doc
        const expectedPath = path.join(__dirname, './media')

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
        expect(sizes.maintainedAspectRatio.url).toContain('/media/image')
        expect(sizes.maintainedAspectRatio.url).toContain('.png')
        expect(sizes.maintainedAspectRatio.width).toEqual(1024)
        expect(sizes.maintainedAspectRatio.height).toEqual(1024)
        expect(sizes).toHaveProperty('tablet')
        expect(sizes).toHaveProperty('mobile')
        expect(sizes).toHaveProperty('icon')
      })

      it('creates from form data given an svg', async () => {
        const formData = new FormData()
        formData.append('file', fs.createReadStream(path.join(__dirname, './image.svg')))

        const { status, doc } = await client.create({
          file: true,
          data: formData,
        })

        expect(status).toBe(201)

        // Check for files
        expect(await fileExists(path.join(__dirname, './media', doc.filename))).toBe(true)

        // Check api response
        expect(doc.mimeType).toEqual('image/svg+xml')
        expect(doc.sizes.maintainedAspectRatio.url).toBeFalsy()
        expect(doc.width).toBeDefined()
        expect(doc.height).toBeDefined()
      })
    })

    it('should have valid image url', async () => {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(path.join(__dirname, './image.png')))

      const { status, doc } = await client.create({
        file: true,
        data: formData,
      })

      expect(status).toBe(201)
      const expectedPath = path.join(__dirname, './media')
      expect(await fileExists(path.join(expectedPath, doc.filename))).toBe(true)

      expect(doc.url).not.toContain('undefined')
    })

    it('creates images that do not require all sizes', async () => {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(path.join(__dirname, './small.png')))

      const { status, doc } = await client.create({
        file: true,
        data: formData,
      })

      expect(status).toBe(201)

      const expectedPath = path.join(__dirname, './media')

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
      formData.append('file', fs.createReadStream(path.join(__dirname, './image.jpg')))

      const { status, doc } = await client.create({
        file: true,
        data: formData,
      })

      expect(status).toBe(201)

      const expectedPath = path.join(__dirname, './media')

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
      formData.append('file', fs.createReadStream(path.join(__dirname, './unstored.png')))

      // unstored media
      const { status, doc } = await client.create({
        slug: 'unstored-media',
        file: true,
        data: formData,
      })

      expect(status).toBe(201)

      // Check for files
      expect(await fileExists(path.join(__dirname, './media', doc.filename))).toBe(false)

      // Check api response
      expect(doc.filename).toBeDefined()
    })

    it('should enlarge images if resize options `withoutEnlargement` is set to false', async () => {
      const small = await getFileByPath(path.resolve(__dirname, './small.png'))

      const result = await payload.create({
        collection: enlargeSlug,
        data: {},
        file: small,
      })

      expect(result).toBeTruthy()

      const { sizes } = result as unknown as Enlarge
      const expectedPath = path.join(__dirname, './media/enlarge')

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
      const small = await getFileByPath(path.resolve(__dirname, './small.png'))

      const result = (await payload.create({
        collection: enlargeSlug,
        data: {},
        file: small,
      })) as unknown as Enlarge

      expect(result).toBeTruthy()

      const { sizes } = result
      const expectedPath = path.join(__dirname, './media/enlarge')

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
      const formData = new FormData()
      formData.append('file', fs.createReadStream(path.join(__dirname, './small.png')))
      const small = await getFileByPath(path.resolve(__dirname, './small.png'))

      const result = await payload.create({
        collection: reduceSlug,
        data: {},
        file: small,
      })

      expect(result).toBeTruthy()

      const { sizes } = result as unknown as Enlarge
      const expectedPath = path.join(__dirname, './media/reduce')

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

  describe('focal point', () => {
    let file

    beforeAll(async () => {
      // Create image
      const filePath = path.resolve(__dirname, './image.png')
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
  })

  it('update', async () => {
    // Create image
    const filePath = path.resolve(__dirname, './image.png')
    const file = await getFileByPath(filePath)
    file.name = 'renamed.png'

    const mediaDoc = (await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })) as unknown as Media

    const formData = new FormData()
    formData.append('file', fs.createReadStream(path.join(__dirname, './small.png')))

    const { status } = await client.update({
      id: mediaDoc.id,
      data: formData,
    })

    expect(status).toBe(200)

    const expectedPath = path.join(__dirname, './media')

    // Check that previously existing files were removed
    expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(true)
    expect(await fileExists(path.join(expectedPath, mediaDoc.sizes.icon.filename))).toBe(true)
  })

  it('update - update many', async () => {
    // Create image
    const filePath = path.resolve(__dirname, './image.png')
    const file = await getFileByPath(filePath)
    file.name = 'renamed.png'

    const mediaDoc = (await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })) as unknown as Media

    const formData = new FormData()
    formData.append('file', fs.createReadStream(path.join(__dirname, './small.png')))

    const { status } = await client.updateMany({
      // id: mediaDoc.id,
      where: {
        id: { equals: mediaDoc.id },
      },
      data: formData,
    })

    expect(status).toBe(200)

    const expectedPath = path.join(__dirname, './media')

    // Check that previously existing files were removed
    expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(true)
    expect(await fileExists(path.join(expectedPath, mediaDoc.sizes.icon.filename))).toBe(true)
  })

  it('should remove existing media on re-upload', async () => {
    // Create temp file
    const filePath = path.resolve(__dirname, './temp.png')
    const file = await getFileByPath(filePath)
    file.name = 'temp.png'

    const mediaDoc = (await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })) as unknown as Media

    const expectedPath = path.join(__dirname, './media')

    // Check that the temp file was created
    expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(true)

    // Replace the temp file with a new one
    const newFilePath = path.resolve(__dirname, './temp-renamed.png')
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
    const filePath = path.resolve(__dirname, './temp.png')
    const file = await getFileByPath(filePath)
    file.name = 'temp.png'

    const mediaDoc = (await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })) as unknown as Media

    const expectedPath = path.join(__dirname, './media')

    // Check that the temp file was created
    expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(true)

    // Replace the temp file with a new one
    const newFilePath = path.resolve(__dirname, './temp-renamed.png')
    const newFile = await getFileByPath(newFilePath)
    newFile.name = 'temp-renamed.png'

    const updatedMediaDoc = (await payload.update({
      collection: mediaSlug,
      where: {
        id: { equals: mediaDoc.id },
      },
      file: newFile,
      data: {},
    })) as unknown as { docs: Media[] }

    // Check that the replacement file was created and the old one was removed
    expect(await fileExists(path.join(expectedPath, updatedMediaDoc.docs[0].filename))).toBe(true)
    expect(await fileExists(path.join(expectedPath, mediaDoc.filename))).toBe(false)
  })

  it('should remove extra sizes on update', async () => {
    const filePath = path.resolve(__dirname, './image.png')
    const file = await getFileByPath(filePath)
    const small = await getFileByPath(path.resolve(__dirname, './small.png'))

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
    const filePath = path.resolve(__dirname, './image.png')
    const file = await getFileByPath(filePath)
    const small = await getFileByPath(path.resolve(__dirname, './small.png'))

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
    const filePath = path.resolve(__dirname, './image.png')
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
    const filePath = path.resolve(__dirname, './image.png')
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
    formData.append('file', fs.createReadStream(path.join(__dirname, './image.png')))

    const { doc } = await client.create({
      file: true,
      data: formData,
    })

    const { status } = await client.delete(doc.id, {
      id: doc.id,
    })

    expect(status).toBe(200)

    expect(await fileExists(path.join(__dirname, doc.filename))).toBe(false)
  })

  it('delete - update many', async () => {
    const formData = new FormData()
    formData.append('file', fs.createReadStream(path.join(__dirname, './image.png')))

    const { doc } = await client.create({
      file: true,
      data: formData,
    })

    const { errors } = await client.deleteMany({
      slug: mediaSlug,
      where: {
        id: { equals: doc.id },
      },
    })

    expect(errors).toHaveLength(0)

    expect(await fileExists(path.join(__dirname, doc.filename))).toBe(false)
  })

  describe('filesRequiredOnCreate', () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    it('should allow file to be optional if filesRequiredOnCreate is false', async () => {
      expect(
        async () =>
          await payload.create({
            // @ts-ignore
            collection: 'optional-file',
            data: {},
          }),
      ).not.toThrow()
    })

    it('should throw an error if no file and filesRequiredOnCreate is true', async () => {
      await expect(async () =>
        payload.create({
          // @ts-ignore
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

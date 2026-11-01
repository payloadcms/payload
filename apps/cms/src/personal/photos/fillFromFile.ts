import type { CollectionBeforeOperationHook, PayloadRequest } from 'payload'

import { readFile } from 'fs/promises'
import sharp from 'sharp'

import { readCameraDetails } from './cameraDetails'
import { describePhoto, isPhotoAIEnabled } from './describePhoto'

type PhotoData = {
  album?: null | number | string | { id?: number | string; title?: string }
  alt?: null | string
  camera?: Record<string, null | string | undefined>
  description?: null | string
  location?: null | string
  tags?: null | string[]
  takenAt?: null | string
  title?: null | string
}

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && !value.trim()) ||
  (Array.isArray(value) && value.length === 0)

async function uploadedImage(req: PayloadRequest) {
  const { file } = req
  if (!file?.mimetype?.startsWith('image/')) return null
  if (file.data?.length) return file.data
  return file.tempFilePath ? readFile(file.tempFilePath) : null
}

async function albumTitle(album: PhotoData['album'], req: PayloadRequest) {
  if (!album) return null
  if (typeof album === 'object') {
    if (album.title || !album.id) return album.title ?? null
    album = album.id
  }

  const doc = await req.payload
    .findByID({
      id: album,
      collection: 'personal-photo-albums',
      depth: 0,
      disableErrors: true,
      draft: true,
      overrideAccess: true,
      req,
      select: { title: true },
    })
    .catch(() => null)

  return doc?.title ?? null
}

/**
 * The photo as it is stored: turned upright, at most 4096 px on its longer side, and without its
 * metadata, such as the GPS location most phones record, which would otherwise be public with the
 * file. Undefined when the file can't be read as an image.
 */
async function withoutMetadata(image: Buffer, mimetype: string) {
  try {
    const photo = sharp(image, { failOn: 'none' })
      .rotate()
      .resize({ fit: 'inside', height: 4096, width: 4096, withoutEnlargement: true })

    if (mimetype === 'image/jpeg') return await photo.jpeg({ quality: 90 }).toBuffer()
    if (mimetype === 'image/webp') return await photo.webp({ quality: 90 }).toBuffer()
    if (mimetype === 'image/png') return await photo.png().toBuffer()
  } catch {
    return undefined
  }
}

/** "IMG_2041-edit.jpg" -> "IMG 2041 edit", for photos that get no title otherwise */
const titleFromFilename = (filename = '') =>
  filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()

/**
 * Prepares a photo from its file before Payload stores it, on upload and when the file is replaced:
 * - fills in the capture date and camera details from its EXIF data
 * - replaces the file with a copy without metadata (see withoutMetadata), which Payload then stores
 *   and makes the sizes from
 * - on upload, fills in an empty title, alt text, description and tags with AI when OPENAI_API_KEY
 *   is set, otherwise the title from the file name
 *
 * Nothing here stops an upload: when reading the file or OpenAI fails, the photo is saved without.
 */
export const fillFromFile: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return args

  const image = await uploadedImage(req).catch(() => null)
  if (!image) return args

  const data = (args.data ?? {}) as PhotoData
  const isNew = operation === 'create'
  const { camera, takenAt } = await readCameraDetails(image)
  const stored = req.file && (await withoutMetadata(image, req.file.mimetype))

  if (req.file && stored) {
    req.file = { ...req.file, data: stored, size: stored.length, tempFilePath: undefined }
  }

  // A replaced file brings its own camera details; on upload they only fill what is still empty
  if (takenAt && (!isNew || isEmpty(data.takenAt))) data.takenAt = takenAt
  if (camera) {
    data.camera = { ...data.camera }
    for (const [key, value] of Object.entries(camera)) {
      if (value && (!isNew || isEmpty(data.camera[key]))) data.camera[key] = value
    }
  }

  const needsText =
    isNew && [data.title, data.alt, data.description, data.tags].some((value) => isEmpty(value))

  if (needsText && isPhotoAIEnabled) {
    try {
      const text = await describePhoto({
        context: { album: await albumTitle(data.album, req), location: data.location },
        image: stored ?? image,
        req,
      })

      for (const key of ['title', 'alt', 'description', 'tags'] as const) {
        if (isEmpty(data[key]) && !isEmpty(text[key])) Object.assign(data, { [key]: text[key] })
      }
    } catch (error) {
      req.payload.logger.warn({
        err: error,
        msg: `Could not write the texts of ${req.file?.name} with AI; saving it without them`,
      })
    }
  }

  if (isNew && isEmpty(data.title)) data.title = titleFromFilename(req.file?.name) || null

  return { ...args, data }
}

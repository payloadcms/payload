import type { CollectionSlug, Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '@tools/test-utils/shared'
import { AdminThumbnailSize } from './collections/AdminThumbnailSize/index.js'
import {
  animatedTypeMedia,
  audioSlug,
  mediaSlug,
  mediaWithoutDeleteAccessSlug,
  relationPreviewSlug,
  relationSlug,
  versionSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  // Create image
  const imageFilePath = path.resolve(dirname, './image.png')
  const imageFile = await getFileByPath(imageFilePath)

  const { id: uploadedImage } = await payload.create({
    collection: mediaSlug,
    data: {},
    file: imageFile,
  })

  await payload.create({ collection: mediaWithoutDeleteAccessSlug, data: {}, file: imageFile })

  const { id: versionedImage } = await payload.create({
    collection: versionSlug,
    data: {
      _status: 'published',
      title: 'upload',
    },
    file: imageFile,
  })

  await payload.create({
    collection: relationSlug,
    data: {
      image: uploadedImage,
      versionedImage,
    },
  })

  // Create animated type images
  const animatedImageFilePath = path.resolve(dirname, './animated.webp')
  const animatedImageFile = await getFileByPath(animatedImageFilePath)

  await payload.create({
    collection: animatedTypeMedia,
    data: {},
    file: animatedImageFile,
  })

  await payload.create({
    collection: versionSlug,
    data: {
      _status: 'published',
      title: 'upload',
    },
    file: animatedImageFile,
  })

  const nonAnimatedImageFilePath = path.resolve(dirname, './non-animated.webp')
  const nonAnimatedImageFile = await getFileByPath(nonAnimatedImageFilePath)

  await payload.create({
    collection: animatedTypeMedia,
    data: {},
    file: nonAnimatedImageFile,
  })

  await payload.create({
    collection: versionSlug,
    data: {
      _status: 'published',
      title: 'upload',
    },
    file: nonAnimatedImageFile,
  })

  // Create audio
  const audioFilePath = path.resolve(dirname, './audio.mp3')
  const audioFile = await getFileByPath(audioFilePath)

  const file = await payload.create({
    collection: mediaSlug,
    data: {},
    file: audioFile,
  })

  await payload.create({
    collection: audioSlug,
    data: {
      audio: file.id,
    },
  })

  // Create admin thumbnail media
  await payload.create({
    collection: AdminThumbnailSize.slug as CollectionSlug,
    data: {},
    file: {
      ...audioFile,
      name: 'audio-thumbnail.mp3', // Override to avoid conflicts
    } as File,
  })

  await payload.create({
    collection: AdminThumbnailSize.slug as CollectionSlug,
    data: {},
    file: {
      ...imageFile,
      name: `thumb-${imageFile?.name}`,
    } as File,
  })

  await payload.create({
    collection: 'admin-thumbnail-function',
    data: {},
    file: {
      ...imageFile,
      name: `function-image-${imageFile?.name}`,
    } as File,
  })

  await payload.create({
    collection: 'admin-thumbnail-with-search-queries',
    data: {},
    file: {
      ...imageFile,
      name: `searchQueries-image-${imageFile?.name}`,
    } as File,
  })

  // Create media with and without relation preview
  const { id: uploadedImageWithPreview } = await payload.create({
    collection: 'media-with-relation-preview',
    data: {},
    file: imageFile,
  })

  await payload.create({
    collection: 'media-without-cache-tags',
    data: {},
    file: {
      ...imageFile,
      name: `withoutCacheTags-image-${imageFile?.name}`,
    } as File,
  })

  const { id: uploadedImageWithoutPreview } = await payload.create({
    collection: 'media-without-relation-preview',
    data: {},
    file: imageFile,
  })

  await payload.create({
    collection: relationPreviewSlug,
    data: {
      imageWithPreview1: uploadedImageWithPreview,
      imageWithPreview2: uploadedImageWithPreview,
      imageWithoutPreview1: uploadedImageWithPreview,
      imageWithoutPreview2: uploadedImageWithoutPreview,
      imageWithPreview3: uploadedImageWithoutPreview,
      imageWithoutPreview3: uploadedImageWithoutPreview,
    },
  })

  await payload.create({
    collection: 'filename-compound-index',
    data: {
      alt: 'alt-1',
    },
    file: imageFile,
  })

  for (let i = 0; i < 20; i++) {
    const data = {
      title: `List View Preview ${i + 1}`,
      imageUpload: uploadedImageWithPreview,
      imageRelationship: uploadedImageWithPreview,
    }
    if (i > 15) {
      data.imageUpload = ''
      data.imageRelationship = ''
    }
    await payload.create({
      collection: 'list-view-preview',
      data,
    })
  }
}

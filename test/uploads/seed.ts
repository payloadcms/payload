import type { CollectionSlug, Payload, RequiredDataFromCollectionSlug } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { AdminThumbnailSize } from './collections/AdminThumbnailSize/index.js'
import {
  adminUploadFilePreviewMapSlug,
  adminUploadFilePreviewSingleSlug,
  animatedTypeMedia,
  audioSlug,
  filePreviewSlug,
  mediaSlug,
  mediaWithFieldsSlug,
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

  // Seed filePreview single collection — one image and one audio doc
  const pdfFilePath = path.resolve(dirname, './test-pdf.pdf')
  const pdfFile = await getFileByPath(pdfFilePath)

  // PDF and video in the media collection (which has no custom filePreview) so the file manager's
  // built-in previews — a browser iframe for PDFs and a native player for video/audio — are
  // exercised alongside the audio doc seeded into media above.
  await payload.create({
    collection: mediaSlug,
    data: {},
    file: pdfFile,
  })

  const videoFilePath = path.resolve(dirname, './christmas-mariachi-in-guadalajara.mp4')
  const videoFile = await getFileByPath(videoFilePath)

  await payload.create({
    collection: mediaSlug,
    data: {},
    file: videoFile,
  })

  // Seed media-with-fields with one of each supported file type, every field filled in and the
  // content derived from the filename. The local API used here bypasses the 2 MB HTTP upload limit.
  // Filenames are prefixed because this collection shares its staticDir with the media collection.
  const horizontalSquaresFile = await getFileByPath(
    path.resolve(dirname, './horizontal-squares.jpg'),
  )

  const mediaWithFieldsDocs: Array<{
    data: RequiredDataFromCollectionSlug<typeof mediaWithFieldsSlug>
    file: Awaited<ReturnType<typeof getFileByPath>>
  }> = [
    {
      file: videoFile,
      data: {
        title: 'Christmas Mariachi in Guadalajara',
        altText: 'Mariachi band performing on a festive stage in Guadalajara',
        caption: 'Christmas mariachi playing in the streets of Guadalajara',
        category: 'People',
        colorProfile: 'sRGB',
        credit: 'Field Recordings Co.',
        description:
          'A festive mariachi performance filmed in Guadalajara during the Christmas season.',
        dimensions: { heightCm: 108, widthCm: 192 },
        exifData: {
          aperture: 'f/2.8',
          camera: 'Sony A7 IV',
          iso: 3200,
          lens: '24-70mm f/2.8',
          shutterSpeed: '1/50',
        },
        featured: true,
        license: 'CC BY',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        location: { city: 'Guadalajara', country: 'Mexico' },
        notes:
          'Seeded from christmas-mariachi-in-guadalajara.mp4 to exercise the built-in video preview.',
        photographer: 'Alejandro Hernández',
        priority: 'High',
        published: true,
        rating: 5,
        shootDate: '2024-12-24T20:00:00.000Z',
        source: 'https://example.com/christmas-mariachi-in-guadalajara',
        tags: ['christmas', 'mariachi', 'guadalajara', 'music', 'video'],
      },
    },
    {
      file: pdfFile,
      data: {
        title: 'Test PDF',
        altText: 'Test PDF document cover page',
        caption: 'Test PDF document',
        category: 'Technology',
        colorProfile: 'CMYK',
        credit: 'Payload',
        description:
          'A sample PDF document used to exercise the built-in PDF preview (browser iframe).',
        dimensions: { heightCm: 29.7, widthCm: 21 },
        exifData: { aperture: 'N/A', camera: 'N/A', iso: 0, lens: 'N/A', shutterSpeed: 'N/A' },
        featured: false,
        license: 'All Rights Reserved',
        licenseUrl: 'https://example.com/licenses/test-pdf',
        location: { city: 'San Francisco', country: 'United States' },
        notes: 'Seeded from test-pdf.pdf to exercise the built-in PDF preview.',
        photographer: 'Payload Docs Team',
        priority: 'Medium',
        published: true,
        rating: 3,
        shootDate: '2024-01-15T09:00:00.000Z',
        source: 'https://example.com/test-pdf',
        tags: ['pdf', 'document', 'test'],
      },
    },
    {
      file: audioFile,
      data: {
        title: 'Audio',
        altText: 'Audio waveform',
        caption: 'Audio clip',
        category: 'Abstract',
        colorProfile: 'sRGB',
        credit: 'Sound Library',
        description:
          'A short audio clip used to exercise the built-in native audio player preview.',
        dimensions: { heightCm: 0, widthCm: 0 },
        exifData: { aperture: 'N/A', camera: 'Zoom H6', iso: 0, lens: 'N/A', shutterSpeed: 'N/A' },
        featured: false,
        license: 'CC BY-SA',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        location: { city: 'Berlin', country: 'Germany' },
        notes: 'Seeded from audio.mp3 to exercise the built-in audio preview.',
        photographer: 'Sound Recordist',
        priority: 'Low',
        published: true,
        rating: 4,
        shootDate: '2023-06-01T12:00:00.000Z',
        source: 'https://example.com/audio',
        tags: ['audio', 'sound', 'mp3'],
      },
    },
    {
      file: horizontalSquaresFile,
      data: {
        title: 'Horizontal Squares',
        altText: 'Rows of horizontal squares forming an abstract pattern',
        caption: 'Horizontal squares pattern',
        category: 'Abstract',
        colorProfile: 'Adobe RGB',
        credit: 'Studio Abstract',
        description: 'An abstract composition of horizontal squares.',
        dimensions: { heightCm: 30, widthCm: 40 },
        exifData: {
          aperture: 'f/8',
          camera: 'Canon EOS R5',
          iso: 100,
          lens: 'RF 50mm f/1.8 STM',
          shutterSpeed: '1/250',
        },
        featured: true,
        license: 'CC BY-NC',
        licenseUrl: 'https://creativecommons.org/licenses/by-nc/4.0/',
        location: { city: 'New York', country: 'United States' },
        notes: 'Seeded from horizontal-squares.jpg.',
        photographer: 'Jamie Doe',
        priority: 'Medium',
        published: true,
        rating: 4,
        shootDate: '2024-03-10T14:30:00.000Z',
        source: 'https://example.com/horizontal-squares',
        tags: ['abstract', 'squares', 'pattern', 'geometric'],
      },
    },
    {
      file: imageFile,
      data: {
        title: 'Image',
        altText: 'Sample PNG image',
        caption: 'Sample image',
        category: 'Technology',
        colorProfile: 'sRGB',
        credit: 'Payload',
        description: 'A sample PNG image.',
        dimensions: { heightCm: 30, widthCm: 30 },
        exifData: { aperture: 'N/A', camera: 'N/A', iso: 0, lens: 'N/A', shutterSpeed: 'N/A' },
        featured: false,
        license: 'Public Domain',
        licenseUrl: 'https://example.com/licenses/public-domain',
        location: { city: 'Denver', country: 'United States' },
        notes: 'Seeded from image.png.',
        photographer: 'Payload',
        priority: 'Medium',
        published: true,
        rating: 3,
        shootDate: '2024-02-20T10:00:00.000Z',
        source: 'https://example.com/image',
        tags: ['image', 'png', 'sample'],
      },
    },
  ]

  for (const { data, file } of mediaWithFieldsDocs) {
    await payload.create({
      collection: mediaWithFieldsSlug,
      data,
      file: { ...file, name: `with-fields-${file?.name}` } as File,
    })
  }

  await payload.create({
    collection: adminUploadFilePreviewSingleSlug,
    data: {},
    file: {
      ...imageFile,
      name: `single-preview-image-${imageFile?.name}`,
    } as File,
  })

  await payload.create({
    collection: adminUploadFilePreviewSingleSlug,
    data: {},
    file: {
      ...audioFile,
      name: `single-preview-audio-${audioFile?.name}`,
    } as File,
  })

  // Seed filePreview map collection — one image (no match), one PDF (exact), one audio (wildcard)
  await payload.create({
    collection: adminUploadFilePreviewMapSlug,
    data: {},
    file: {
      ...imageFile,
      name: `map-preview-image-${imageFile?.name}`,
    } as File,
  })

  await payload.create({
    collection: adminUploadFilePreviewMapSlug,
    data: {},
    file: {
      ...pdfFile,
      name: `map-preview-pdf-${pdfFile?.name}`,
    } as File,
  })

  await payload.create({
    collection: adminUploadFilePreviewMapSlug,
    data: {},
    file: {
      ...audioFile,
      name: `map-preview-audio-${audioFile?.name}`,
    } as File,
  })

  // Seed file-preview collection — image and audio to exercise the switch-case component
  await payload.create({
    collection: filePreviewSlug,
    data: {},
    file: {
      ...imageFile,
      name: `file-preview-image-${imageFile?.name}`,
    } as File,
  })

  await payload.create({
    collection: filePreviewSlug,
    data: {},
    file: {
      ...audioFile,
      name: `file-preview-audio-${audioFile?.name}`,
    } as File,
  })
}

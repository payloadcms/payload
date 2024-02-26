import path from 'path'

import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import removeFiles from '../helpers/removeFiles'
import { Uploads1 } from './collections/Upload1'
import Uploads2 from './collections/Upload2'
import AdminThumbnailCol from './collections/admin-thumbnail'
import {
  audioSlug,
  enlargeSlug,
  mediaSlug,
  reduceSlug,
  relationSlug,
  unstoredMediaSlug,
} from './shared'

export default buildConfigWithDefaults({
  serverURL: undefined,
  collections: [
    {
      slug: relationSlug,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      slug: audioSlug,
      fields: [
        {
          name: 'audio',
          type: 'upload',
          relationTo: 'media',
          filterOptions: {
            mimeType: {
              in: ['audio/mpeg'],
            },
          },
        },
      ],
    },
    {
      slug: 'gif-resize',
      upload: {
        staticURL: '/media-gif',
        staticDir: path.resolve(process.cwd(), 'test/uploads/media-gif'),
        mimeTypes: ['image/gif'],
        resizeOptions: {
          position: 'center',
          width: 200,
          height: 200,
        },
        formatOptions: {
          format: 'gif',
        },
        imageSizes: [
          {
            name: 'small',
            width: 100,
            height: 100,
            formatOptions: { format: 'gif', options: { quality: 90 } },
          },
          {
            name: 'large',
            width: 1000,
            height: 1000,
            formatOptions: { format: 'gif', options: { quality: 90 } },
          },
        ],
      },
      fields: [],
    },
    {
      slug: 'no-image-sizes',
      upload: {
        staticURL: '/no-image-sizes',
        staticDir: path.resolve(process.cwd(), 'test/uploads/no-image-sizes'),
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        resizeOptions: {
          position: 'center',
          width: 200,
          height: 200,
        },
      },
      fields: [],
    },
    {
      slug: 'object-fit',
      upload: {
        staticURL: '/object-fit',
        staticDir: path.resolve(process.cwd(), 'test/uploads/object-fit'),
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        imageSizes: [
          {
            name: 'fitContain',
            width: 400,
            height: 300,
            fit: 'contain',
          },
          {
            name: 'fitInside',
            width: 300,
            height: 400,
            fit: 'inside',
          },
          {
            name: 'fitCover',
            width: 900,
            height: 300,
            fit: 'cover',
          },
          {
            name: 'fitOutside',
            width: 900,
            height: 200,
            fit: 'outside',
          },
        ],
      },
      fields: [],
    },
    {
      slug: 'crop-only',
      upload: {
        focalPoint: false,
        staticURL: '/crop-only',
        staticDir: path.resolve(process.cwd(), 'test/uploads/crop-only'),
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        imageSizes: [
          {
            name: 'focalTest',
            width: 400,
            height: 300,
          },
          {
            name: 'focalTest2',
            width: 600,
            height: 300,
          },
          {
            name: 'focalTest3',
            width: 900,
            height: 300,
          },
        ],
      },
      fields: [],
    },
    {
      slug: 'focal-only',
      upload: {
        crop: false,
        staticURL: '/focal-only',
        staticDir: path.resolve(process.cwd(), 'test/uploads/focal-only'),
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        imageSizes: [
          {
            name: 'focalTest',
            width: 400,
            height: 300,
          },
          {
            name: 'focalTest2',
            width: 600,
            height: 300,
          },
          {
            name: 'focalTest3',
            width: 900,
            height: 300,
          },
        ],
      },
      fields: [],
    },
    {
      slug: mediaSlug,
      upload: {
        staticURL: '/media',
        staticDir: path.resolve(process.cwd(), 'test/uploads/media'),
        // crop: false,
        // focalPoint: false,
        mimeTypes: [
          'image/png',
          'image/jpg',
          'image/jpeg',
          'image/gif',
          'image/svg+xml',
          'audio/mpeg',
        ],
        formatOptions: {
          format: 'png',
          options: { quality: 90 },
        },
        imageSizes: [
          {
            name: 'maintainedAspectRatio',
            width: 1024,
            height: undefined,
            crop: 'center',
            position: 'center',
            formatOptions: { format: 'png', options: { quality: 90 } },
          },
          {
            name: 'differentFormatFromMainImage',
            width: 200,
            height: undefined,
            formatOptions: { format: 'jpg', options: { quality: 90 } },
          },
          {
            name: 'maintainedImageSize',
            width: undefined,
            height: undefined,
          },
          {
            name: 'maintainedImageSizeWithNewFormat',
            width: undefined,
            height: undefined,
            formatOptions: { format: 'jpg', options: { quality: 90 } },
          },
          {
            name: 'accidentalSameSize',
            width: 320,
            height: 80,
            position: 'top',
          },
          {
            name: 'tablet',
            width: 640,
            height: 480,
          },
          {
            name: 'mobile',
            width: 320,
            height: 240,
            crop: 'left top',
          },
          {
            name: 'icon',
            width: 16,
            height: 16,
          },
          {
            name: 'focalTest',
            width: 400,
            height: 300,
          },
          {
            name: 'focalTest2',
            width: 600,
            height: 300,
          },
          {
            name: 'focalTest3',
            width: 900,
            height: 300,
          },
          {
            name: 'focalTest4',
            width: 300,
            height: 400,
          },
          {
            name: 'focalTest5',
            width: 300,
            height: 600,
          },
          {
            name: 'focalTest6',
            width: 300,
            height: 800,
          },
          {
            name: 'focalTest7',
            width: 300,
            height: 300,
          },
        ],
      },
      fields: [],
    },
    {
      slug: enlargeSlug,
      upload: {
        staticURL: '/enlarge',
        staticDir: path.resolve(process.cwd(), 'test/uploads/media/enlarge'),
        mimeTypes: [
          'image/png',
          'image/jpg',
          'image/jpeg',
          'image/gif',
          'image/svg+xml',
          'audio/mpeg',
        ],
        imageSizes: [
          {
            name: 'accidentalSameSize',
            width: 320,
            height: 80,
            withoutEnlargement: false,
          },
          {
            name: 'sameSizeWithNewFormat',
            width: 320,
            height: 80,
            formatOptions: { format: 'jpg', options: { quality: 90 } },
            withoutEnlargement: false,
          },
          {
            name: 'resizedLarger',
            width: 640,
            height: 480,
            withoutEnlargement: false,
          },
          {
            name: 'resizedSmaller',
            width: 180,
            height: 50,
          },
          {
            name: 'widthLowerHeightLarger',
            width: 300,
            height: 300,
            fit: 'contain',
          },
        ],
      },
      fields: [],
    },
    {
      slug: reduceSlug,
      upload: {
        staticURL: '/reduce',
        staticDir: path.resolve(process.cwd(), 'test/uploads/media/reduce'),
        mimeTypes: [
          'image/png',
          'image/jpg',
          'image/jpeg',
          'image/gif',
          'image/svg+xml',
          'audio/mpeg',
        ],
        imageSizes: [
          {
            name: 'accidentalSameSize',
            width: 320,
            height: 80,
            withoutEnlargement: false,
          },
          {
            name: 'sameSizeWithNewFormat',
            width: 320,
            height: 80,
            formatOptions: { format: 'jpg', options: { quality: 90 } },
            withoutReduction: true,
          },
          {
            name: 'resizedLarger',
            width: 640,
            height: 480,
          },
          {
            name: 'resizedSmaller',
            width: 180,
            height: 50,
            withoutReduction: true,
          },
        ],
      },
      fields: [],
    },
    {
      slug: 'media-trim',
      upload: {
        staticURL: '/media-trim',
        staticDir: path.resolve(process.cwd(), 'test/uploads/media-trim'),
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        trimOptions: 0,
        imageSizes: [
          {
            name: 'trimNumber',
            width: 1024,
            height: undefined,
            trimOptions: 0,
          },
          {
            name: 'trimString',
            width: 1024,
            height: undefined,
            trimOptions: 0,
          },
          {
            name: 'trimOptions',
            width: 1024,
            height: undefined,
            trimOptions: {
              background: '#000000',
              threshold: 50,
            },
          },
        ],
      },
      fields: [],
    },
    {
      slug: unstoredMediaSlug,
      upload: {
        staticURL: '/media',
        disableLocalStorage: true,
      },
      fields: [],
    },
    {
      slug: 'externally-served-media',
      upload: {
        // Either use another web server like `npx serve -l 4000` (http://localhost:4000) or use the static server from the previous collection to serve the media folder (http://localhost:3000/media)
        staticURL: 'http://localhost:3000/media',
        staticDir: path.resolve(process.cwd(), 'test/uploads/media'),
      },
      fields: [],
    },
    Uploads1,
    Uploads2,
    AdminThumbnailCol,
    {
      slug: 'optional-file',
      upload: {
        staticURL: '/optional',
        staticDir: path.resolve(process.cwd(), 'test/uploads/optional'),
        filesRequiredOnCreate: false,
      },
      fields: [],
    },
    {
      slug: 'required-file',
      upload: {
        staticURL: '/required',
        staticDir: path.resolve(process.cwd(), 'test/uploads/required'),
        filesRequiredOnCreate: true,
      },
      fields: [],
    },
  ],
  onInit: async (payload) => {
    const uploadsDir = path.resolve(process.cwd(), 'test/uploads/media')
    removeFiles(path.normalize(uploadsDir))

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // Create image
    const imageFilePath = path.resolve(process.cwd(), 'test/uploads/image.png')
    const imageFile = await getFileByPath(imageFilePath)

    const { id: uploadedImage } = await payload.create({
      collection: mediaSlug,
      data: {},
      file: imageFile,
    })

    await payload.create({
      collection: relationSlug,
      data: {
        image: uploadedImage,
      },
    })

    // Create audio
    const audioFilePath = path.resolve(process.cwd(), 'test/uploads/audio.mp3')
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
      collection: AdminThumbnailCol.slug,
      data: {},
      file: {
        ...audioFile,
        name: 'audio-thumbnail.mp3', // Override to avoid conflicts
      },
    })

    await payload.create({
      collection: AdminThumbnailCol.slug,
      data: {},
      file: {
        ...imageFile,
        name: `thumb-${imageFile.name}`,
      },
    })
  },
})

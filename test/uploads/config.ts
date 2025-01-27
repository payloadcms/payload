import path from 'path'

import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import removeFiles from '../helpers/removeFiles'
import { Uploads1 } from './collections/Upload1'
import Uploads2 from './collections/Upload2'
import AdminThumbnailCol from './collections/admin-thumbnail'
import {
  animatedTypeMedia,
  audioSlug,
  cropOnlySlug,
  customFileNameMediaSlug,
  enlargeSlug,
  focalOnlySlug,
  globalWithMedia,
  mediaSlug,
  mediaWithRelationPreviewSlug,
  mediaWithoutRelationPreviewSlug,
  reduceSlug,
  relationPreviewSlug,
  relationSlug,
  versionSlug,
} from './shared'

const mockModulePath = path.resolve(__dirname, './mocks/mockFSModule.js')

export default buildConfigWithDefaults({
  admin: {
    webpack: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config?.resolve?.alias,
          fs: mockModulePath,
        },
      },
    }),
  },
  collections: [
    {
      slug: relationSlug,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'versionedImage',
          type: 'upload',
          relationTo: versionSlug,
        },
      ],
    },
    {
      slug: audioSlug,
      fields: [
        {
          name: 'audio',
          type: 'upload',
          filterOptions: {
            mimeType: {
              in: ['audio/mpeg'],
            },
          },
          relationTo: 'media',
        },
      ],
    },
    {
      slug: 'gif-resize',
      fields: [],
      upload: {
        formatOptions: {
          format: 'gif',
        },
        imageSizes: [
          {
            name: 'small',
            formatOptions: { format: 'gif', options: { quality: 90 } },
            height: 100,
            width: 100,
          },
          {
            name: 'large',
            formatOptions: { format: 'gif', options: { quality: 90 } },
            height: 1000,
            width: 1000,
          },
        ],
        mimeTypes: ['image/gif'],
        resizeOptions: {
          height: 200,
          position: 'center',
          width: 200,
        },
        staticDir: './media-gif',
        staticURL: '/media-gif',
      },
    },
    {
      slug: 'no-image-sizes',
      fields: [],
      upload: {
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        resizeOptions: {
          height: 200,
          position: 'center',
          width: 200,
        },
        staticDir: './no-image-sizes',
        staticURL: '/no-image-sizes',
      },
    },
    {
      slug: 'object-fit',
      fields: [],
      upload: {
        imageSizes: [
          {
            name: 'fitContain',
            fit: 'contain',
            height: 300,
            width: 400,
          },
          {
            name: 'fitInside',
            fit: 'inside',
            height: 400,
            width: 300,
          },
          {
            name: 'fitCover',
            fit: 'cover',
            height: 300,
            width: 900,
          },
          {
            name: 'fitOutside',
            fit: 'outside',
            height: 200,
            width: 900,
          },
        ],
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        staticDir: './object-fit',
        staticURL: '/object-fit',
      },
    },
    {
      slug: 'with-meta-data',
      fields: [],
      upload: {
        imageSizes: [
          {
            name: 'sizeOne',
            height: 300,
            width: 400,
          },
        ],
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        staticDir: './with-meta-data',
        withMetadata: true,
      },
    },
    {
      slug: 'without-meta-data',
      fields: [],
      upload: {
        imageSizes: [
          {
            name: 'sizeTwo',
            height: 400,
            width: 300,
          },
        ],
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        staticDir: './without-meta-data',
        withMetadata: false,
      },
    },
    {
      slug: 'with-only-jpeg-meta-data',
      fields: [],
      upload: {
        imageSizes: [
          {
            name: 'sizeThree',
            height: 400,
            width: 300,
            withoutEnlargement: false,
          },
        ],
        staticDir: './with-only-jpeg-meta-data',
        // eslint-disable-next-line @typescript-eslint/require-await
        withMetadata: async ({ metadata }) => {
          if (metadata.format === 'jpeg') {
            return true
          }
          return false
        },
      },
    },
    {
      slug: customFileNameMediaSlug,
      fields: [],
      upload: {
        imageSizes: [
          {
            name: 'custom',
            height: 500,
            width: 500,
            generateImageName: ({ extension, height, width, sizeName }) =>
              `${sizeName}-${width}x${height}.${extension}`,
          },
        ],
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        staticDir: `./${customFileNameMediaSlug}`,
      },
    },
    {
      slug: cropOnlySlug,
      fields: [],
      upload: {
        focalPoint: false,
        imageSizes: [
          {
            name: 'focalTest',
            height: 300,
            width: 400,
          },
          {
            name: 'focalTest2',
            height: 300,
            width: 600,
          },
          {
            name: 'focalTest3',
            height: 300,
            width: 900,
          },
        ],
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        staticDir: './crop-only',
        staticURL: '/crop-only',
      },
    },
    {
      slug: focalOnlySlug,
      fields: [],
      upload: {
        crop: false,
        imageSizes: [
          {
            name: 'focalTest',
            height: 300,
            width: 400,
          },
          {
            name: 'focalTest2',
            height: 300,
            width: 600,
          },
          {
            name: 'focalTest3',
            height: 300,
            width: 900,
          },
        ],
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        staticDir: './focal-only',
        staticURL: '/focal-only',
      },
    },
    {
      slug: 'focal-no-sizes',
      fields: [],
      upload: {
        crop: false,
        focalPoint: true,
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        staticDir: './focal-no-sizes',
        staticURL: '/focal-no-sizes',
      },
    },
    {
      slug: mediaSlug,
      fields: [],
      upload: {
        staticDir: './media',
        staticURL: '/media',
        // crop: false,
        // focalPoint: false,
        formatOptions: {
          format: 'png',
          options: { quality: 90 },
        },
        imageSizes: [
          {
            name: 'maintainedAspectRatio',
            crop: 'center',
            formatOptions: { format: 'png', options: { quality: 90 } },
            height: undefined,
            position: 'center',
            width: 1024,
          },
          {
            name: 'differentFormatFromMainImage',
            formatOptions: { format: 'jpg', options: { quality: 90 } },
            height: undefined,
            width: 200,
          },
          {
            name: 'maintainedImageSize',
            height: undefined,
            width: undefined,
          },
          {
            name: 'maintainedImageSizeWithNewFormat',
            formatOptions: { format: 'jpg', options: { quality: 90 } },
            height: undefined,
            width: undefined,
          },
          {
            name: 'accidentalSameSize',
            height: 80,
            position: 'top',
            width: 320,
          },
          {
            name: 'tablet',
            height: 480,
            width: 640,
          },
          {
            name: 'mobile',
            crop: 'left top',
            height: 240,
            width: 320,
          },
          {
            name: 'icon',
            height: 16,
            width: 16,
          },
          {
            name: 'focalTest',
            height: 300,
            width: 400,
          },
          {
            name: 'focalTest2',
            height: 300,
            width: 600,
          },
          {
            name: 'focalTest3',
            height: 300,
            width: 900,
          },
          {
            name: 'focalTest4',
            height: 400,
            width: 300,
          },
          {
            name: 'focalTest5',
            height: 600,
            width: 300,
          },
          {
            name: 'focalTest6',
            height: 800,
            width: 300,
          },
          {
            name: 'focalTest7',
            height: 300,
            width: 300,
          },
        ],
        mimeTypes: [
          'image/png',
          'image/jpg',
          'image/jpeg',
          'image/gif',
          'image/svg+xml',
          'image/tiff',
          'audio/mpeg',
        ],
      },
    },
    {
      slug: animatedTypeMedia,
      fields: [],
      upload: {
        staticDir: './media',
        staticURL: '/media',
        resizeOptions: {
          position: 'center',
          width: 200,
          height: 200,
        },
        imageSizes: [
          {
            name: 'squareSmall',
            width: 480,
            height: 480,
            position: 'centre',
            withoutEnlargement: false,
          },
          {
            name: 'undefinedHeight',
            width: 300,
            height: undefined,
          },
          {
            name: 'undefinedWidth',
            width: undefined,
            height: 300,
          },
          {
            name: 'undefinedAll',
            width: undefined,
            height: undefined,
          },
        ],
      },
    },
    {
      slug: enlargeSlug,
      fields: [],
      upload: {
        imageSizes: [
          {
            name: 'accidentalSameSize',
            height: 80,
            width: 320,
            withoutEnlargement: false,
          },
          {
            name: 'sameSizeWithNewFormat',
            formatOptions: { format: 'jpg', options: { quality: 90 } },
            height: 80,
            width: 320,
            withoutEnlargement: false,
          },
          {
            name: 'resizedLarger',
            height: 480,
            width: 640,
            withoutEnlargement: false,
          },
          {
            name: 'resizedSmaller',
            height: 50,
            width: 180,
          },
          {
            name: 'widthLowerHeightLarger',
            fit: 'contain',
            height: 300,
            width: 300,
          },
        ],
        mimeTypes: [
          'image/png',
          'image/jpg',
          'image/jpeg',
          'image/gif',
          'image/svg+xml',
          'audio/mpeg',
        ],
        staticDir: './media/enlarge',
        staticURL: '/enlarge',
      },
    },
    {
      slug: reduceSlug,
      fields: [],
      upload: {
        imageSizes: [
          {
            name: 'accidentalSameSize',
            height: 80,
            width: 320,
            withoutEnlargement: false,
          },
          {
            name: 'sameSizeWithNewFormat',
            formatOptions: { format: 'jpg', options: { quality: 90 } },
            height: 80,
            width: 320,
            withoutReduction: true,
          },
          {
            name: 'resizedLarger',
            height: 480,
            width: 640,
          },
          {
            name: 'resizedSmaller',
            height: 50,
            width: 180,
            withoutReduction: true,
          },
        ],
        mimeTypes: [
          'image/png',
          'image/jpg',
          'image/jpeg',
          'image/gif',
          'image/svg+xml',
          'audio/mpeg',
        ],
        staticDir: './media/reduce',
        staticURL: '/reduce',
      },
    },
    {
      slug: 'media-trim',
      fields: [],
      upload: {
        imageSizes: [
          {
            name: 'trimNumber',
            height: undefined,
            trimOptions: 0,
            width: 1024,
          },
          {
            name: 'trimString',
            height: undefined,
            trimOptions: 0,
            width: 1024,
          },
          {
            name: 'trimOptions',
            height: undefined,
            trimOptions: {
              background: '#000000',
              threshold: 50,
            },
            width: 1024,
          },
        ],
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
        staticDir: './media-trim',
        staticURL: '/media-trim',
        trimOptions: 0,
      },
    },
    {
      slug: 'unstored-media',
      fields: [],
      upload: {
        disableLocalStorage: true,
        staticURL: '/media',
      },
    },
    {
      slug: 'externally-served-media',
      fields: [],
      upload: {
        // Either use another web server like `npx serve -l 4000` (http://localhost:4000) or use the static server from the previous collection to serve the media folder (http://localhost:3000/media)
        staticDir: './media',
        staticURL: 'http://localhost:3000/media',
      },
    },
    Uploads1,
    Uploads2,
    AdminThumbnailCol,
    {
      slug: 'optional-file',
      fields: [],
      upload: {
        filesRequiredOnCreate: false,
        staticDir: './optional',
        staticURL: '/optional',
      },
    },
    {
      slug: 'required-file',
      fields: [],
      upload: {
        filesRequiredOnCreate: true,
        staticDir: './required',
        staticURL: '/required',
      },
    },
    {
      slug: versionSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      upload: true,
      versions: {
        drafts: true,
      },
    },
    {
      slug: mediaWithRelationPreviewSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      upload: {
        displayPreview: true,
      },
    },
    {
      slug: mediaWithoutRelationPreviewSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      upload: true,
    },
    {
      slug: relationPreviewSlug,
      fields: [
        {
          name: 'imageWithPreview1',
          type: 'upload',
          relationTo: mediaWithRelationPreviewSlug,
        },
        {
          name: 'imageWithPreview2',
          type: 'upload',
          relationTo: mediaWithRelationPreviewSlug,
          displayPreview: true,
        },
        {
          name: 'imageWithoutPreview1',
          type: 'upload',
          relationTo: mediaWithRelationPreviewSlug,
          displayPreview: false,
        },
        {
          name: 'imageWithoutPreview2',
          type: 'upload',
          relationTo: mediaWithoutRelationPreviewSlug,
        },
        {
          name: 'imageWithPreview3',
          type: 'upload',
          relationTo: mediaWithoutRelationPreviewSlug,
          displayPreview: true,
        },
        {
          name: 'imageWithoutPreview3',
          type: 'upload',
          relationTo: mediaWithoutRelationPreviewSlug,
          displayPreview: false,
        },
      ],
    },
  ],
  globals: [
    {
      slug: globalWithMedia,
      fields: [
        {
          type: 'upload',
          name: 'media',
          relationTo: cropOnlySlug,
        },
      ],
    },
  ],
  onInit: async (payload) => {
    const uploadsDir = path.resolve(__dirname, './media')
    removeFiles(path.normalize(uploadsDir))

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // Create image
    const imageFilePath = path.resolve(__dirname, './image.png')
    const imageFile = await getFileByPath(imageFilePath)

    const { id: uploadedImage } = await payload.create({
      collection: mediaSlug,
      data: {},
      file: imageFile,
    })

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
    const animatedImageFilePath = path.resolve(__dirname, './animated.webp')
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

    const nonAnimatedImageFilePath = path.resolve(__dirname, './non-animated.webp')
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
    const audioFilePath = path.resolve(__dirname, './audio.mp3')
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

    // Create media with and without relation preview
    const { id: uploadedImageWithPreview } = await payload.create({
      collection: mediaWithRelationPreviewSlug,
      data: {},
      file: imageFile,
    })

    const { id: uploadedImageWithoutPreview } = await payload.create({
      collection: mediaWithoutRelationPreviewSlug,
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
  },
  serverURL: undefined,
})

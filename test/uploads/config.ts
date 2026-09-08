import path from 'path'
import { fileURLToPath } from 'url'

import { getTestSuiteDir } from '../__helpers/shared/getTestSuiteDir.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { AdminThumbnailFunction } from './collections/AdminThumbnailFunction/index.js'
import { AdminThumbnailSize } from './collections/AdminThumbnailSize/index.js'
import { AdminThumbnailWithSearchQueries } from './collections/AdminThumbnailWithSearchQueries/index.js'
import { AdminUploadControl } from './collections/AdminUploadControl/index.js'
import {
  AdminUploadFilePreviewMap,
  AdminUploadFilePreviewSingle,
} from './collections/AdminUploadFilePreview/index.js'
import { AnyImageTypeCollection } from './collections/AnyImageType/index.js'
import { BulkUploadsCollection } from './collections/BulkUploads/index.js'
import { BulkUploadsHookErrorCollection } from './collections/BulkUploadsHookError/index.js'
import { ClientUploadTempFileCollection } from './collections/ClientUploadTempFile/index.js'
import { CustomUploadFieldCollection } from './collections/CustomUploadField/index.js'
import { FileMimeType } from './collections/FileMimeType/index.js'
import { FilePreviewCollection } from './collections/FilePreview/index.js'
import { NoFilesRequired } from './collections/NoFilesRequired/index.js'
import { RelationToNoFilesRequired } from './collections/RelationToNoFilesRequired/index.js'
import { SimpleRelationshipCollection } from './collections/SimpleRelationship/index.js'
import { Uploads1 } from './collections/Upload1/index.js'
import { Uploads2 } from './collections/Upload2/index.js'
import { seed } from './seed.js'
import {
  allowListMediaSlug,
  animatedTypeMedia,
  audioSlug,
  constructorOptionsSlug,
  customFileNameMediaSlug,
  enlargeSlug,
  focalNoSizesSlug,
  hideFileInputOnCreateSlug,
  imageSizesOnlySlug,
  listViewPreviewSlug,
  mediaSlug,
  mediaWithFieldsSlug,
  mediaWithImageSizeAdminPropsSlug,
  mediaWithoutCacheTagsSlug,
  mediaWithoutDeleteAccessSlug,
  mediaWithoutRelationPreviewSlug,
  mediaWithoutWriteAccessSlug,
  mediaWithRelationPreviewSlug,
  noRestrictFileMimeTypesSlug,
  noRestrictFileTypesSlug,
  pdfOnlySlug,
  prefixMediaSlug,
  reduceSlug,
  relationPreviewSlug,
  relationSlug,
  restrictedMimeTypesSlug,
  restrictFileTypesSlug,
  skipAllowListSafeFetchMediaSlug,
  skipSafeFetchHeaderFilterSlug,
  skipSafeFetchMediaSlug,
  svgOnlySlug,
  threeDimensionalSlug,
  unstoredMediaSlug,
  versionSlug,
  withoutEnlargeSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = getTestSuiteDir({ fallbackDir: path.dirname(filename), suitePath: 'uploads' })

export default buildConfigWithDefaults({
  suite: 'uploads',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
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
          {
            name: 'hideFileInputOnCreate',
            type: 'upload',
            relationTo: hideFileInputOnCreateSlug,
          },
          {
            name: 'hasManyImage',
            type: 'upload',
            hasMany: true,
            relationTo: 'media',
          },
          {
            name: 'polymorphicUploads',
            type: 'upload',
            hasMany: true,
            relationTo: ['uploads-1', 'uploads-2'],
          },
          {
            type: 'tabs',
            tabs: [
              {
                fields: [
                  {
                    name: 'blocks',
                    type: 'blocks',
                    blocks: [
                      {
                        slug: 'localizedMediaBlock',
                        fields: [
                          {
                            name: 'media',
                            type: 'upload',
                            localized: true,
                            relationTo: 'media',
                            required: true,
                          },
                          {
                            name: 'relatedMedia',
                            type: 'relationship',
                            hasMany: true,
                            localized: true,
                            maxRows: 5,
                            relationTo: 'media',
                          },
                        ],
                      },
                    ],
                  },
                ],
                label: 'a',
              },
            ],
          },
        ],
        versions: { drafts: { autosave: true } },
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
        versions: false,
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
          staticDir: path.resolve(dirname, './media-gif'),
        },
        versions: false,
      },
      {
        slug: 'filename-compound-index',
        fields: [
          {
            name: 'alt',
            type: 'text',
            admin: {
              description: 'Alt text to be used for compound index',
            },
          },
        ],
        upload: {
          filenameCompoundIndex: ['filename', 'alt'],
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
          mimeTypes: ['image/*'],
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
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
          staticDir: path.resolve(dirname, './no-image-sizes'),
        },
        versions: false,
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
          staticDir: path.resolve(dirname, './object-fit'),
        },
        versions: false,
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
          staticDir: path.resolve(dirname, './with-meta-data'),
          withMetadata: true,
        },
        versions: false,
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
          staticDir: path.resolve(dirname, './without-meta-data'),
          withMetadata: false,
        },
        versions: false,
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
          staticDir: path.resolve(dirname, './with-only-jpeg-meta-data'),
          // eslint-disable-next-line @typescript-eslint/require-await
          withMetadata: async ({ metadata }) => {
            if (metadata.format === 'jpeg') {
              return true
            }
            return false
          },
        },
        versions: false,
      },
      {
        slug: 'crop-only',
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
          staticDir: path.resolve(dirname, './crop-only'),
        },
        versions: false,
      },
      {
        slug: 'focal-only',
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
          staticDir: path.resolve(dirname, './focal-only'),
        },
        versions: false,
      },
      {
        slug: imageSizesOnlySlug,
        fields: [],
        upload: {
          crop: false,
          focalPoint: false,
          imageSizes: [
            {
              name: 'sizeOne',
              height: 300,
              width: 400,
            },
            {
              name: 'sizeTwo',
              height: 400,
              width: 300,
            },
          ],
          staticDir: path.resolve(dirname, './image-sizes-only'),
        },
        versions: false,
      },
      {
        slug: focalNoSizesSlug,
        fields: [],
        upload: {
          crop: false,
          focalPoint: true,
          mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
          staticDir: path.resolve(dirname, './focal-no-sizes'),
        },
        versions: false,
      },
      {
        slug: mediaSlug,
        fields: [
          {
            name: 'alt',
            type: 'text',
          },
          {
            name: 'localized',
            type: 'text',
            localized: true,
          },
        ],
        upload: {
          staticDir: path.resolve(dirname, './media'),
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
            {
              name: 'undefinedHeight',
              width: 300,
            },
          ],
          pasteURL: false,
        },
        versions: false,
      },
      {
        slug: allowListMediaSlug,
        fields: [],
        upload: {
          pasteURL: {
            allowList: [
              { hostname: '127.0.0.1', port: '', protocol: 'http', search: '' },
              { hostname: 'localhost', port: '', protocol: 'http', search: '' },
              { hostname: '[::1]', port: '', protocol: 'http', search: '' },
              { hostname: '10.0.0.1', port: '', protocol: 'http', search: '' },
              { hostname: '192.168.1.1', port: '', protocol: 'http', search: '' },
              { hostname: '172.16.0.1', port: '', protocol: 'http', search: '' },
              { hostname: '169.254.1.1', port: '', protocol: 'http', search: '' },
              { hostname: '224.0.0.1', port: '', protocol: 'http', search: '' },
              { hostname: '0.0.0.0', port: '', protocol: 'http', search: '' },
              { hostname: '255.255.255.255', port: '', protocol: 'http', search: '' },
            ],
          },
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: skipSafeFetchMediaSlug,
        fields: [],
        upload: {
          skipSafeFetch: true,
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: skipSafeFetchHeaderFilterSlug,
        fields: [],
        upload: {
          externalFileHeaderFilter: (headers) => headers, // Keep all headers including cookies
          skipSafeFetch: true,
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: skipAllowListSafeFetchMediaSlug,
        fields: [],
        upload: {
          skipSafeFetch: [{ hostname: '127.0.0.1', port: '', protocol: 'http', search: '' }],
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: restrictFileTypesSlug,
        fields: [],
        upload: {
          allowRestrictedFileTypes: false,
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: noRestrictFileTypesSlug,
        fields: [],
        upload: {
          allowRestrictedFileTypes: true,
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: noRestrictFileMimeTypesSlug,
        fields: [],
        upload: {
          mimeTypes: ['text/html'],
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: pdfOnlySlug,
        fields: [],
        upload: {
          mimeTypes: ['application/pdf'],
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: restrictedMimeTypesSlug,
        fields: [],
        upload: {
          mimeTypes: ['image/png'],
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: animatedTypeMedia,
        fields: [],
        upload: {
          imageSizes: [
            {
              name: 'squareSmall',
              height: 480,
              position: 'centre',
              width: 480,
              withoutEnlargement: false,
            },
            {
              name: 'undefinedHeight',
              height: undefined,
              width: 300,
            },
            {
              name: 'undefinedWidth',
              height: 300,
              width: undefined,
            },
            {
              name: 'undefinedAll',
              height: undefined,
              width: undefined,
            },
          ],
          resizeOptions: {
            height: 200,
            position: 'center',
            width: 200,
          },
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
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
            {
              name: 'undefinedHeightWithoutEnlargement',
              height: undefined,
              width: 4000,
              withoutEnlargement: undefined,
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
          staticDir: path.resolve(dirname, './media/enlarge'),
        },
        versions: false,
      },
      {
        slug: withoutEnlargeSlug,
        fields: [],
        upload: {
          resizeOptions: {
            fit: 'inside',
            height: undefined,
            width: 1000,
            withoutEnlargement: true,
          },
          staticDir: path.resolve(dirname, './media/without-enlarge'),
        },
        versions: false,
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
          staticDir: path.resolve(dirname, './media/reduce'),
        },
        versions: false,
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
          staticDir: path.resolve(dirname, './media-trim'),
          trimOptions: 0,
        },
        versions: false,
      },
      {
        slug: customFileNameMediaSlug,
        fields: [],
        upload: {
          imageSizes: [
            {
              name: 'custom',
              generateImageName: ({ extension, height, sizeName, width }) =>
                `${sizeName}-${width}x${height}.${extension}`,
              height: 500,
              width: 500,
            },
          ],
          mimeTypes: ['image/png', 'image/jpg', 'image/jpeg'],
          staticDir: path.resolve(dirname, `./${customFileNameMediaSlug}`),
        },
        versions: false,
      },
      {
        slug: unstoredMediaSlug,
        fields: [],
        upload: {
          disableLocalStorage: true,
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: 'externally-served-media',
        fields: [],
        upload: {
          // Either use another web server like `npx serve -l 4000` (http://localhost:4000) or use the static server from the previous collection to serve the media folder (http://localhost:3000/media)
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      Uploads1,
      Uploads2,
      AnyImageTypeCollection,
      AdminThumbnailFunction,
      AdminThumbnailWithSearchQueries,
      AdminThumbnailSize,
      AdminUploadControl,
      AdminUploadFilePreviewSingle,
      AdminUploadFilePreviewMap,
      FilePreviewCollection,
      NoFilesRequired,
      RelationToNoFilesRequired,
      {
        slug: 'optional-file',
        fields: [],
        upload: {
          filesRequiredOnCreate: false,
          staticDir: path.resolve(dirname, './optional'),
        },
        versions: false,
      },
      {
        slug: 'required-file',
        fields: [],
        upload: {
          filesRequiredOnCreate: true,
          staticDir: path.resolve(dirname, './required'),
        },
        versions: false,
      },
      {
        slug: versionSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        upload: {
          filesRequiredOnCreate: true,
          staticDir: path.resolve(dirname, `./${versionSlug}`),
        },
        versions: {
          drafts: true,
        },
      },
      CustomUploadFieldCollection,
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
          staticDir: path.resolve(dirname, './media-with-relation-preview'),
        },
        versions: false,
      },
      {
        slug: mediaWithoutCacheTagsSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        upload: {
          cacheTags: false,
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: mediaWithoutRelationPreviewSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        upload: {
          displayPreview: false,
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
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
            displayPreview: true,
            relationTo: mediaWithRelationPreviewSlug,
          },
          {
            name: 'imageWithoutPreview1',
            type: 'upload',
            displayPreview: false,
            relationTo: mediaWithRelationPreviewSlug,
          },
          {
            name: 'imageWithoutPreview2',
            type: 'upload',
            relationTo: mediaWithoutRelationPreviewSlug,
          },
          {
            name: 'imageWithPreview3',
            type: 'upload',
            displayPreview: true,
            relationTo: mediaWithoutRelationPreviewSlug,
          },
          {
            name: 'imageWithoutPreview3',
            type: 'upload',
            displayPreview: false,
            relationTo: mediaWithoutRelationPreviewSlug,
          },
        ],
        versions: false,
      },
      {
        slug: hideFileInputOnCreateSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        hooks: {
          beforeOperation: [
            ({ operation, req }) => {
              if (operation !== 'create') {
                return
              }
              const buffer = Buffer.from('This file was generated by a hook', 'utf-8')
              req.file = {
                name: `${new Date().toISOString()}.txt`,
                data: buffer,
                mimetype: 'text/plain',
                size: buffer.length,
              }
            },
          ],
        },
        upload: {
          hideFileInputOnCreate: true,
          hideRemoveFile: true,
          staticDir: path.resolve(dirname, 'uploads'),
        },
        versions: false,
      },
      {
        slug: 'best-fit',
        fields: [
          {
            name: 'withAdminThumbnail',
            type: 'upload',
            relationTo: 'admin-thumbnail-function',
          },
          {
            name: 'withinRange',
            type: 'upload',
            relationTo: enlargeSlug,
          },
          {
            name: 'nextSmallestOutOfRange',
            type: 'upload',
            relationTo: 'focal-only',
          },
          {
            name: 'original',
            type: 'upload',
            relationTo: 'focal-only',
          },
        ],
        versions: false,
      },
      {
        slug: listViewPreviewSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'imageUpload',
            type: 'upload',
            displayPreview: true,
            relationTo: mediaWithRelationPreviewSlug,
          },
          {
            name: 'imageRelationship',
            type: 'relationship',
            relationTo: mediaWithRelationPreviewSlug,
          },
        ],
        versions: false,
      },
      {
        slug: threeDimensionalSlug,
        fields: [],
        upload: {
          crop: false,
          focalPoint: false,
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: constructorOptionsSlug,
        fields: [],
        upload: {
          constructorOptions: {
            limitInputPixels: 100, // set lower than the collection upload fileSize limit default to test
          },
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      BulkUploadsCollection,
      BulkUploadsHookErrorCollection,
      ClientUploadTempFileCollection,
      SimpleRelationshipCollection,
      FileMimeType,
      {
        slug: svgOnlySlug,
        fields: [],
        upload: {
          mimeTypes: ['image/svg+xml'],
          staticDir: path.resolve(dirname, './svg-only'),
        },
        versions: false,
      },
      {
        slug: mediaWithoutDeleteAccessSlug,
        access: { delete: () => false },
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: mediaWithoutWriteAccessSlug,
        access: {
          create: () => false,
          update: () => false,
        },
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: mediaWithImageSizeAdminPropsSlug,
        fields: [],
        upload: {
          imageSizes: [
            {
              name: 'one',
              admin: {
                disabled: { column: true, filter: true },
              },
              height: 200,
              width: 200,
            },
            {
              name: 'two',
              admin: {
                disabled: { column: true },
              },
              height: 300,
              width: 300,
            },
            {
              name: 'three',
              admin: {
                disabled: { filter: true },
              },
              height: 400,
              width: 400,
            },
            {
              name: 'four',
              height: 400,
              width: 300,
            },
          ],
          staticDir: path.resolve(dirname, './media'),
        },
        versions: false,
      },
      {
        slug: prefixMediaSlug,
        fields: [
          {
            name: 'prefix',
            type: 'text',
          },
        ],
        upload: {
          staticDir: path.resolve(dirname, './prefix-media'),
        },
        versions: false,
      },
      {
        slug: mediaWithFieldsSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            type: 'textarea',
          },
          {
            name: 'altText',
            type: 'text',
            label: 'Alt Text',
          },
          {
            name: 'caption',
            type: 'text',
          },
          {
            name: 'credit',
            type: 'text',
            label: 'Photo Credit',
          },
          {
            name: 'source',
            type: 'text',
            label: 'Source URL',
          },
          {
            name: 'category',
            type: 'select',
            options: ['Nature', 'Architecture', 'People', 'Abstract', 'Technology'],
          },
          {
            name: 'tags',
            type: 'text',
            hasMany: true,
          },
          {
            name: 'featured',
            type: 'checkbox',
            label: 'Featured Image',
          },
          {
            name: 'photographer',
            type: 'text',
            admin: {
              position: 'sidebar',
            },
          },
          {
            name: 'priority',
            type: 'select',
            defaultValue: 'Medium',
            options: ['Low', 'Medium', 'High'],
          },
          {
            name: 'shootDate',
            type: 'date',
            label: 'Shoot Date',
          },
          {
            name: 'location',
            type: 'group',
            fields: [
              {
                name: 'city',
                type: 'text',
              },
              {
                name: 'country',
                type: 'text',
              },
            ],
          },
          {
            name: 'dimensions',
            type: 'group',
            fields: [
              {
                name: 'widthCm',
                type: 'number',
                label: 'Width (cm)',
              },
              {
                name: 'heightCm',
                type: 'number',
                label: 'Height (cm)',
              },
            ],
            label: 'Original Dimensions',
          },
          {
            name: 'colorProfile',
            type: 'select',
            label: 'Color Profile',
            options: ['sRGB', 'Adobe RGB', 'ProPhoto RGB', 'CMYK'],
          },
          {
            name: 'license',
            type: 'select',
            options: ['All Rights Reserved', 'CC BY', 'CC BY-SA', 'CC BY-NC', 'Public Domain'],
          },
          {
            name: 'licenseUrl',
            type: 'text',
            label: 'License URL',
          },
          {
            name: 'notes',
            type: 'textarea',
            label: 'Internal Notes',
          },
          {
            name: 'rating',
            type: 'number',
            max: 5,
            min: 1,
          },
          {
            name: 'exifData',
            type: 'group',
            fields: [
              {
                name: 'camera',
                type: 'text',
              },
              {
                name: 'lens',
                type: 'text',
              },
              {
                name: 'iso',
                type: 'number',
                label: 'ISO',
              },
              {
                name: 'aperture',
                type: 'text',
              },
              {
                name: 'shutterSpeed',
                type: 'text',
                label: 'Shutter Speed',
              },
            ],
            label: 'EXIF Data',
          },
          {
            name: 'published',
            type: 'checkbox',
            defaultValue: false,
          },
        ],
        upload: {
          crop: true,
          imageSizes: [
            {
              name: 'thumbnail',
              crop: 'centre',
              height: 300,
              width: 300,
            },
            {
              name: 'card',
              height: 512,
              width: 768,
            },
            {
              name: 'hero',
              height: 1080,
              width: 1920,
            },
            {
              name: 'carousel1',
              height: 100,
              width: 100,
            },
            {
              name: 'carousel2',
              height: 100,
              width: 150,
            },
            {
              name: 'carousel3',
              height: 150,
              width: 100,
            },
            {
              name: 'carousel4',
              height: 120,
              width: 200,
            },
            {
              name: 'carousel5',
              height: 200,
              width: 120,
            },
            {
              name: 'carousel6',
              height: 250,
              width: 250,
            },
            {
              name: 'carousel7',
              height: 180,
              width: 320,
            },
            {
              name: 'carousel8',
              height: 320,
              width: 180,
            },
            {
              name: 'carousel9',
              height: 300,
              width: 400,
            },
            {
              name: 'carousel10',
              height: 400,
              width: 300,
            },
            {
              name: 'carousel11',
              height: 200,
              width: 500,
            },
            {
              name: 'carousel12',
              height: 500,
              width: 200,
            },
            {
              name: 'carousel13',
              height: 360,
              width: 640,
            },
            {
              name: 'carousel14',
              height: 640,
              width: 360,
            },
            {
              name: 'carousel15',
              height: 128,
              width: 128,
            },
            {
              name: 'carousel16',
              height: 96,
              width: 96,
            },
            {
              name: 'carousel17',
              height: 64,
              width: 64,
            },
            {
              name: 'carousel18',
              height: 450,
              width: 800,
            },
            {
              name: 'carousel19',
              height: 800,
              width: 450,
            },
            {
              name: 'carousel20',
              height: 1000,
              width: 1000,
            },
          ],
          staticDir: path.resolve(dirname, './media'),
        },
      },
    ],
    localization: {
      defaultLocale: 'en',
      locales: ['en', 'es', 'fr'],
    },
    serverURL: undefined,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      // debug: true,
      abortOnLimit: true,
      limits: {
        fileSize: 2_000_000, // 2MB
      },
    },
  },
  seed,
})

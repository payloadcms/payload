import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { UploadConfig, UploadEdits } from './types.js'

import { isNumber } from '../utilities/isNumber.js'
import { generateFilePathOrURL } from './generateFilePathOrURL.js'
import { mimeTypeValidator } from './mimeTypeValidator.js'

const getUploadEdits = (req: PayloadRequest): undefined | UploadEdits =>
  req.query?.uploadEdits && typeof req.query.uploadEdits === 'object'
    ? (req.query.uploadEdits as UploadEdits)
    : undefined

const disabledFromImageSize = (
  sizeAdmin: { disabled?: { column?: boolean; filter?: boolean; groupBy?: boolean } } | undefined,
): { disabled: { column: boolean; filter: boolean; groupBy: boolean } } => {
  return {
    disabled: {
      column: sizeAdmin?.disabled?.column ?? false,
      filter: sizeAdmin?.disabled?.filter ?? false,
      groupBy: sizeAdmin?.disabled?.groupBy ?? false,
    },
  }
}

type Options = {
  collection: CollectionConfig
  config: Config
}

export const getBaseUploadFields = ({ collection, config }: Options): Field[] => {
  const uploadOptions: UploadConfig = typeof collection.upload === 'object' ? collection.upload : {}

  const mimeType: Field = {
    name: 'mimeType',
    type: 'text',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'MIME Type',
  }

  const thumbnailURL: Field = {
    name: 'thumbnailURL',
    type: 'text',
    admin: {
      hidden: true,
      readOnly: true,
    },
    hooks: {
      afterRead: [
        ({ originalDoc, req }) => {
          const adminThumbnail =
            typeof collection.upload !== 'boolean' ? collection.upload?.adminThumbnail : undefined

          if (typeof adminThumbnail === 'function') {
            return adminThumbnail({ doc: originalDoc })
          }

          return generateFilePathOrURL({
            collectionSlug: collection.slug,
            config,
            filename:
              typeof adminThumbnail === 'string'
                ? (originalDoc.sizes?.[adminThumbnail]?.filename as string)
                : undefined,
            relative: false,
            serverURL: req.payload.config.serverURL,
            urlOrPath:
              typeof adminThumbnail === 'string'
                ? (originalDoc.sizes?.[adminThumbnail]?.url as string)
                : undefined,
          })
        },
      ],
    },
    label: 'Thumbnail URL',
  }

  const width: Field = {
    name: 'width',
    type: 'number',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: ({ t }) => t('upload:width'),
  }

  const height: Field = {
    name: 'height',
    type: 'number',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: ({ t }) => t('upload:height'),
  }

  const filesize: Field = {
    name: 'filesize',
    type: 'number',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: ({ t }) => t('upload:fileSize'),
  }

  const filename: Field = {
    name: 'filename',
    type: 'text',
    admin: {
      disabled: { bulkEdit: true },
      hidden: true,
      readOnly: true,
    },
    index: true,
    label: ({ t }) => t('upload:fileName'),
  }

  // Only set unique: true if the collection does not have a compound index
  if (
    collection.upload === true ||
    (typeof collection.upload === 'object' && !collection.upload.filenameCompoundIndex)
  ) {
    filename.unique = true
  }

  const url: Field = {
    name: 'url',
    type: 'text',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'URL',
  }

  let uploadFields: Field[] = [
    {
      ...url,
      hooks: {
        afterRead: [
          ({ data, originalDoc, req, value }) =>
            generateFilePathOrURL({
              collectionSlug: collection.slug,
              config,
              filename: data?.filename || originalDoc?.filename,
              relative: false,
              serverURL: req.payload.config.serverURL,
              urlOrPath: value,
            }),
        ],
        beforeChange: [
          ({ collection, data, originalDoc, req, value }) =>
            generateFilePathOrURL({
              collectionSlug: collection?.slug as string,
              config,
              filename: data?.filename || originalDoc?.filename,
              relative: true,
              serverURL: req.payload.config.serverURL,
              urlOrPath: value,
            }),
        ],
      },
    },
    thumbnailURL,
    filename,
    mimeType,
    filesize,
    width,
    height,
  ]

  if (uploadOptions.crop !== false) {
    uploadFields.push({
      name: 'cropRect',
      type: 'group',
      admin: {
        disabled: { column: true, filter: true, groupBy: true },
        hidden: true,
      },
      fields: [
        {
          name: 'x',
          type: 'number',
        },
        {
          name: 'y',
          type: 'number',
        },
        {
          name: 'width',
          type: 'number',
        },
        {
          name: 'height',
          type: 'number',
        },
        {
          name: 'unit',
          type: 'select',
          options: ['%', 'px'],
        },
      ],
      hooks: {
        beforeChange: [
          ({ data, req, value }) => {
            const crop = getUploadEdits(req)?.crop

            if (crop) {
              return crop
            }

            if (data?.filename === null) {
              return null
            }

            return value
          },
        ],
      },
    })
  }

  // Add focal point fields if not disabled
  if (
    uploadOptions.focalPoint !== false ||
    uploadOptions.imageSizes ||
    uploadOptions.resizeOptions
  ) {
    uploadFields = uploadFields.concat(
      (['focalX', 'focalY'] as const).map((name) => {
        return {
          name,
          type: 'number',
          admin: {
            disabled: { column: true, filter: true, groupBy: true },
            hidden: true,
          },
          hooks: {
            beforeChange: [
              ({ req, value }) => {
                const focalPoint = getUploadEdits(req)?.focalPoint

                if (!focalPoint) {
                  return value
                }

                const coordinate = name === 'focalX' ? focalPoint.x : focalPoint.y
                return isNumber(coordinate) ? Math.round(Number(coordinate)) : 50
              },
            ],
          },
        }
      }),
    )
  }

  if (uploadOptions.mimeTypes) {
    mimeType.validate = mimeTypeValidator(uploadOptions.mimeTypes)
  }

  if (uploadOptions.imageSizes) {
    uploadFields = uploadFields.concat([
      {
        name: 'sizes',
        type: 'group',
        admin: {
          hidden: true,
        },
        fields: uploadOptions.imageSizes.map((size) => ({
          name: size.name,
          type: 'group',
          admin: {
            hidden: true,
            ...disabledFromImageSize(size.admin),
          },
          fields: [
            {
              ...url,
              admin: {
                ...url.admin,
                ...disabledFromImageSize(size.admin),
              },
              hooks: {
                afterRead: [
                  ({ collection, data, originalDoc, req, value }) =>
                    generateFilePathOrURL({
                      collectionSlug: collection?.slug as string,
                      config,
                      filename:
                        data?.sizes?.[size.name]?.filename ||
                        originalDoc?.sizes?.[size.name]?.filename,
                      relative: false,
                      serverURL: req.payload.config.serverURL,
                      urlOrPath: value,
                    }),
                ],
                beforeChange: [
                  ({ collection, data, originalDoc, req, value }) =>
                    generateFilePathOrURL({
                      collectionSlug: collection?.slug as string,
                      config,
                      filename:
                        data?.sizes?.[size.name]?.filename ||
                        originalDoc?.sizes?.[size.name]?.filename,
                      relative: true,
                      serverURL: req.payload.config.serverURL,
                      urlOrPath: value,
                    }),
                ],
              },
            },
            {
              ...width,
              admin: {
                ...width.admin,
                ...disabledFromImageSize(size.admin),
              },
            },
            {
              ...height,
              admin: {
                ...height.admin,
                ...disabledFromImageSize(size.admin),
              },
            },
            {
              ...mimeType,
              admin: {
                ...mimeType.admin,
                ...disabledFromImageSize(size.admin),
              },
            },
            {
              ...filesize,
              admin: {
                ...filesize.admin,
                ...disabledFromImageSize(size.admin),
              },
            },
            {
              ...filename,
              admin: {
                ...filename.admin,
                ...disabledFromImageSize(size.admin),
              },
              unique: false,
            },
          ],
          label: size.name,
        })),
        label: ({ t }) => t('upload:sizes'),
      },
    ])
  }
  return uploadFields
}

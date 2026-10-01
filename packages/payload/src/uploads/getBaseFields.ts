import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { SanitizedUploadConfig } from './types.js'

import { generateFilePathOrURL } from './generateFilePathOrURL.js'
import { getUploadVariantsFieldName } from './getUploadVariantsFieldName.js'
import { mimeTypeValidator } from './mimeTypeValidator.js'
import { validateUploadFilename } from './validateUploadFilename.js'

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
  const variantsFieldName = getUploadVariantsFieldName({ config })
  // `variants` only exists once a transformer (e.g. Sharp) has written it back during init.
  const uploadOptions: Partial<SanitizedUploadConfig> =
    typeof collection.upload === 'object' ? collection.upload : {}

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
                ? (originalDoc[variantsFieldName]?.[adminThumbnail]?.filename as string)
                : undefined,
            relative: false,
            serverURL: req.payload.config.serverURL,
            urlOrPath:
              typeof adminThumbnail === 'string'
                ? (originalDoc[variantsFieldName]?.[adminThumbnail]?.url as string)
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
    validate: validateUploadFilename,
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

  // Add focal point fields if not disabled
  if (
    uploadOptions.focalPoint !== false ||
    uploadOptions.variants ||
    uploadOptions.hasImageAdjustments
  ) {
    uploadFields = uploadFields.concat(
      ['focalX', 'focalY'].map((name) => {
        return {
          name,
          type: 'number',
          admin: {
            disabled: { column: true, filter: true, groupBy: true },
            hidden: true,
          },
        }
      }),
    )
  }

  if (uploadOptions.mimeTypes) {
    mimeType.validate = mimeTypeValidator(uploadOptions.mimeTypes)
  }

  if (uploadOptions.variants) {
    uploadFields = uploadFields.concat([
      {
        name: variantsFieldName,
        type: 'group',
        admin: {
          hidden: true,
        },
        fields: uploadOptions.variants.map((size) => ({
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
                        data?.[variantsFieldName]?.[size.name]?.filename ||
                        originalDoc?.[variantsFieldName]?.[size.name]?.filename,
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
                        data?.[variantsFieldName]?.[size.name]?.filename ||
                        originalDoc?.[variantsFieldName]?.[size.name]?.filename,
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

    // With `legacySizes`, variants stay stored under the 3.x `sizes` field so an unmigrated
    // database keeps working, and `variants` is the read-only alias of it.
    if (variantsFieldName === 'sizes') {
      uploadFields.push({
        name: 'variants',
        type: 'group',
        admin: {
          hidden: true,
        },
        // Same shape as `sizes`, without its hooks or indexes: the value is copied from `sizes` on
        // read, and `where`/`select`/`sort` paths are rewritten to it.
        fields: uploadOptions.variants.map((size) => ({
          name: size.name,
          type: 'group',
          fields: [url, width, height, mimeType, filesize, filename].map(toLegacySizesAliasField),
        })),
        virtual: 'sizes',
      })
    }
  }
  return uploadFields
}

/** A plain copy of a base upload field for the read-only `variants` alias. */
const toLegacySizesAliasField = (field: Field): Field => {
  const {
    hooks: _hooks,
    index: _index,
    unique: _unique,
    ...aliasField
  } = field as {
    hooks?: unknown
    index?: boolean
    unique?: boolean
  } & Field

  return aliasField as Field
}

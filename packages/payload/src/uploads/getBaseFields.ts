import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { SanitizedUploadConfig } from './types.js'

import { generateFilePathOrURL } from './generateFilePathOrURL.js'
import { mimeTypeValidator } from './mimeTypeValidator.js'
import { buildTransformStateJSONSchema } from './transformState/buildTransformStateJSONSchema.js'
import { migrateLegacyFocalPoint } from './transformState/migrateLegacyFocalPoint.js'
import { validateTransformState } from './transformState/validateTransformState.js'
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
                ? (originalDoc.variants?.[adminThumbnail]?.filename as string)
                : undefined,
            relative: false,
            serverURL: req.payload.config.serverURL,
            urlOrPath:
              typeof adminThumbnail === 'string'
                ? (originalDoc.variants?.[adminThumbnail]?.url as string)
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
    {
      name: '_transforms',
      type: 'json',
      admin: { hidden: true },
      defaultValue: () => null,
      hooks: {
        afterRead: [
          ({ data, value }) =>
            migrateLegacyFocalPoint({ doc: { ...data, _transforms: value } })._transforms,
        ],
      },
      jsonSchema: buildTransformStateJSONSchema({
        transformers: config.upload?.transformers ?? [],
      }),
      validate: (value, { collectionSlug, data, req }) => {
        validateTransformState({ collectionSlug, doc: data, req, value })

        return true
      },
    },
    {
      name: 'original',
      type: 'group',
      admin: {
        hidden: true,
        readOnly: true,
      },
      fields: [
        { ...filename, index: false, unique: false },
        {
          ...url,
          hooks: {
            afterRead: [
              ({ data, originalDoc, req, value }) => {
                return generateFilePathOrURL({
                  collectionSlug: collection.slug,
                  config,
                  filename: data?.original?.filename || originalDoc?.original?.filename,
                  relative: false,
                  serverURL: req.payload.config.serverURL,
                  urlOrPath: value,
                })
              },
            ],
            beforeChange: [
              ({ data, originalDoc, req, value }) => {
                return generateFilePathOrURL({
                  collectionSlug: collection.slug,
                  config,
                  filename: data?.original?.filename || originalDoc?.original?.filename,
                  relative: true,
                  serverURL: req.payload.config.serverURL,
                  urlOrPath: value,
                })
              },
            ],
          },
        },
        mimeType,
        filesize,
        width,
        height,
        {
          name: 'prefix',
          type: 'text',
          admin: { disabled: true, hidden: true, readOnly: true },
        },
        { name: '_objectKey', type: 'text', hidden: true },
      ],
    },
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
          access: { create: () => false, update: () => false },
          admin: {
            disabled: { column: true, filter: true, groupBy: true },
            hidden: true,
            readOnly: true,
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
        name: 'variants',
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
                        data?.variants?.[size.name]?.filename ||
                        originalDoc?.variants?.[size.name]?.filename,
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
                        data?.variants?.[size.name]?.filename ||
                        originalDoc?.variants?.[size.name]?.filename,
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
            {
              name: 'prefix',
              type: 'text',
              admin: { disabled: true, hidden: true, readOnly: true },
            },
            { name: '_objectKey', type: 'text', hidden: true },
          ],
          label: size.name,
        })),
        label: ({ t }) => t('upload:sizes'),
      },
    ])
  }
  return uploadFields
}

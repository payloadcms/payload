import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { UploadConfig } from './types.js'

import { formatAdminURL } from '../utilities/formatAdminURL.js'
import { mimeTypeValidator } from './mimeTypeValidator.js'

type GenerateURLArgs = {
  collectionSlug: string
  config: Config
  filename?: string
}
const generateURL = ({ collectionSlug, config, filename }: GenerateURLArgs) => {
  if (filename) {
    return formatAdminURL({
      apiRoute: config.routes?.api || '',
      path: `/${collectionSlug}/file/${encodeURIComponent(filename)}`,
      serverURL: config.serverURL,
    })
  }
  return undefined
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
        ({ originalDoc }) => {
          const adminThumbnail =
            typeof collection.upload !== 'boolean' ? collection.upload?.adminThumbnail : undefined

          if (typeof adminThumbnail === 'function') {
            return adminThumbnail({ doc: originalDoc })
          }

          if (
            typeof adminThumbnail === 'string' &&
            'sizes' in originalDoc &&
            originalDoc.sizes?.[adminThumbnail]?.filename
          ) {
            return generateURL({
              collectionSlug: collection.slug,
              config,
              filename: originalDoc.sizes?.[adminThumbnail].filename as string,
            })
          }

          return null
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
      disableBulkEdit: true,
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
          ({ data, value }) => {
            if (value && !data?.filename) {
              return value
            }

            return generateURL({
              collectionSlug: collection.slug,
              config,
              filename: data?.filename,
            })
          },
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
    uploadOptions.imageSizes ||
    uploadOptions.resizeOptions
  ) {
    uploadFields = uploadFields.concat(
      ['focalX', 'focalY'].map((name) => {
        return {
          name,
          type: 'number',
          admin: {
            disableGroupBy: true,
            disableListColumn: true,
            disableListFilter: true,
            hidden: true,
          },
        }
      }),
    )
  }

  if (uploadOptions.mimeTypes) {
    mimeType.validate = mimeTypeValidator(uploadOptions.mimeTypes)
  }

  // In Payload v4, image size subfields (`url`, `width`, `height`, etc.) should
  // default to `disableGroupBy: true`, `disableListColumn: true` and `disableListFilter: true`
  // to avoid cluttering the collection list view and filters by default.
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
            ...(size.admin?.disableGroupBy && { disableGroupBy: true }),
            ...(size.admin?.disableListColumn && { disableListColumn: true }),
            ...(size.admin?.disableListFilter && { disableListFilter: true }),
          },
          fields: [
            {
              ...url,
              admin: {
                ...url.admin,
                ...(size.admin?.disableGroupBy && { disableGroupBy: true }),
                ...(size.admin?.disableListColumn && { disableListColumn: true }),
                ...(size.admin?.disableListFilter && { disableListFilter: true }),
              },
              hooks: {
                afterRead: [
                  ({ data, value }) => {
                    if (value && size.height && size.width && !data?.filename) {
                      return value
                    }

                    const sizeFilename = data?.sizes?.[size.name]?.filename

                    if (sizeFilename) {
                      return formatAdminURL({
                        apiRoute: config.routes?.api || '',
                        path: `/${collection.slug}/file/${encodeURIComponent(sizeFilename)}`,
                        serverURL: config.serverURL,
                      })
                    }

                    return null
                  },
                ],
              },
            },
            {
              ...width,
              admin: {
                ...width.admin,
                ...(size.admin?.disableGroupBy && { disableGroupBy: true }),
                ...(size.admin?.disableListColumn && { disableListColumn: true }),
                ...(size.admin?.disableListFilter && { disableListFilter: true }),
              },
            },
            {
              ...height,
              admin: {
                ...height.admin,
                ...(size.admin?.disableGroupBy && { disableGroupBy: true }),
                ...(size.admin?.disableListColumn && { disableListColumn: true }),
                ...(size.admin?.disableListFilter && { disableListFilter: true }),
              },
            },
            {
              ...mimeType,
              admin: {
                ...mimeType.admin,
                ...(size.admin?.disableGroupBy && { disableGroupBy: true }),
                ...(size.admin?.disableListColumn && { disableListColumn: true }),
                ...(size.admin?.disableListFilter && { disableListFilter: true }),
              },
            },
            {
              ...filesize,
              admin: {
                ...filesize.admin,
                ...(size.admin?.disableGroupBy && { disableGroupBy: true }),
                ...(size.admin?.disableListColumn && { disableListColumn: true }),
                ...(size.admin?.disableListFilter && { disableListFilter: true }),
              },
            },
            {
              ...filename,
              admin: {
                ...filename.admin,
                ...(size.admin?.disableGroupBy && { disableGroupBy: true }),
                ...(size.admin?.disableListColumn && { disableListColumn: true }),
                ...(size.admin?.disableListFilter && { disableListFilter: true }),
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

import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { UploadConfig } from './types.js'

import { extractTranslations } from '../translations/extractTranslations.js'
import { mimeTypeValidator } from './mimeTypeValidator.js'

const labels = extractTranslations([
  'upload:width',
  'upload:height',
  'upload:fileSize',
  'upload:fileName',
  'upload:sizes',
])

type GenerateURLArgs = {
  collectionSlug: string
  config: Config
  filename?: string
}
const generateURL = ({ collectionSlug, config, filename }: GenerateURLArgs) => {
  if (filename) {
    return `${config.serverURL || ''}${config.routes.api || ''}/${collectionSlug}/file/${filename}`
  }
  return undefined
}

type Args = {
  collectionConfig?: CollectionConfig
  config: Config
  doc: Record<string, unknown>
}
const generateAdminThumbnails = ({ collectionConfig, config, doc }: Args) => {
  const adminThumbnail =
    typeof collectionConfig.upload !== 'boolean'
      ? collectionConfig.upload?.adminThumbnail
      : undefined

  if (typeof adminThumbnail === 'function') {
    return adminThumbnail({ doc })
  }

  if ('sizes' in doc && doc.sizes?.[adminThumbnail]?.filename) {
    return generateURL({
      collectionSlug: collectionConfig.slug,
      config,
      filename: doc.sizes?.[adminThumbnail].filename as string,
    })
  }

  return generateURL({
    collectionSlug: collectionConfig.slug,
    config,
    filename: doc.filename as string,
  })
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

  const url: Field = {
    name: 'url',
    type: 'text',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'URL',
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
        ({ data }) =>
          generateAdminThumbnails({
            collectionConfig: collection,
            config,
            doc: data,
          }),
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
    label: labels['upload:width'],
  }

  const height: Field = {
    name: 'height',
    type: 'number',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: labels['upload:height'],
  }

  const filesize: Field = {
    name: 'filesize',
    type: 'number',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: labels['upload:fileSize'],
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
    label: labels['upload:fileName'],
    unique: true,
  }

  let uploadFields: Field[] = [
    {
      ...url,
      hooks: {
        afterRead: [
          ({ data }) =>
            generateURL({
              collectionSlug: collection.slug,
              config,
              filename: data?.filename,
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
          },
          fields: [
            {
              ...url,
              hooks: {
                afterRead: [
                  ({ data }) => {
                    const sizeFilename = data?.sizes?.[size.name]?.filename

                    if (sizeFilename) {
                      return `${config.serverURL}${config.routes.api}/${collection.slug}/file/${sizeFilename}`
                    }

                    return null
                  },
                ],
              },
            },
            width,
            height,
            mimeType,
            filesize,
            {
              ...filename,
              unique: false,
            },
          ],
          label: size.name,
        })),
        label: labels['upload:Sizes'],
      },
    ])
  }
  return uploadFields
}

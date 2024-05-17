import type { CollectionConfig } from '../collections/config/types'
import type { Config } from '../config/types'
import type { Field } from '../fields/config/types'
import type { IncomingUploadType } from './types'

import { extractTranslations } from '../translations/extractTranslations'
import { mimeTypeValidator } from './mimeTypeValidator'

const labels = extractTranslations([
  'upload:width',
  'upload:height',
  'upload:fileSize',
  'upload:fileName',
  'upload:sizes',
])

type Options = {
  collection: CollectionConfig
  config: Config
}

const getBaseUploadFields = ({ collection, config }: Options): Field[] => {
  const uploadOptions: IncomingUploadType =
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

  const url: Field = {
    name: 'url',
    type: 'text',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'URL',
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
          ({ data }) => {
            if (data?.filename) {
              if (uploadOptions.staticURL.startsWith('/')) {
                return `${config.serverURL}${uploadOptions.staticURL}/${data.filename}`
              }
              return `${uploadOptions.staticURL}/${data.filename}`
            }

            return undefined
          },
        ],
      },
    },
    filename,
    mimeType,
    filesize,
    width,
    height,
  ]

  if (uploadOptions.mimeTypes) {
    mimeType.validate = mimeTypeValidator(uploadOptions.mimeTypes)
  }

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
            hidden: true,
          },
        }
      }),
    )
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
                      if (uploadOptions.staticURL.startsWith('/')) {
                        return `${config.serverURL}${uploadOptions.staticURL}/${sizeFilename}`
                      }
                      return `${uploadOptions.staticURL}/${sizeFilename}`
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
        label: labels['upload:sizes'],
      },
    ])
  }

  return uploadFields
}

export default getBaseUploadFields

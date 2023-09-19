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
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'MIME Type',
    type: 'text',
  }

  const url: Field = {
    name: 'url',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'URL',
    type: 'text',
  }

  const width: Field = {
    name: 'width',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: labels['upload:width'],
    type: 'number',
  }

  const height: Field = {
    name: 'height',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: labels['upload:height'],
    type: 'number',
  }

  const filesize: Field = {
    name: 'filesize',
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: labels['upload:fileSize'],
    type: 'number',
  }

  const filename: Field = {
    name: 'filename',
    admin: {
      disableBulkEdit: true,
      hidden: true,
      readOnly: true,
    },
    index: true,
    label: labels['upload:fileName'],
    type: 'text',
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

  if (uploadOptions.imageSizes) {
    uploadFields = uploadFields.concat([
      {
        name: 'sizes',
        admin: {
          hidden: true,
        },
        fields: uploadOptions.imageSizes.map((size) => ({
          name: size.name,
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

                    return undefined
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
          type: 'group',
        })),
        label: labels['upload:Sizes'],
        type: 'group',
      },
    ])
  }
  return uploadFields
}

export default getBaseUploadFields

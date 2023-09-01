import type { CollectionConfig } from '../collections/config/types';
import type { Config } from '../config/types';
import type { Field } from '../fields/config/types';
import type { IncomingUploadType } from './types';

import { extractTranslations } from '../translations/extractTranslations';
import { mimeTypeValidator } from './mimeTypeValidator';

const labels = extractTranslations(['upload:width', 'upload:height', 'upload:fileSize', 'upload:fileName', 'upload:sizes']);

type Options = {
  collection: CollectionConfig
  config: Config
}

const getBaseUploadFields = ({ collection, config }: Options): Field[] => {
  const uploadOptions: IncomingUploadType = typeof collection.upload === 'object' ? collection.upload : {};

  const mimeType: Field = {
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'MIME Type',
    name: 'mimeType',
    type: 'text',
  };

  const url: Field = {
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: 'URL',
    name: 'url',
    type: 'text',
  };

  const width: Field = {
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: labels['upload:width'],
    name: 'width',
    type: 'number',
  };

  const height: Field = {
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: labels['upload:height'],
    name: 'height',
    type: 'number',
  };

  const filesize: Field = {
    admin: {
      hidden: true,
      readOnly: true,
    },
    label: labels['upload:fileSize'],
    name: 'filesize',
    type: 'number',
  };

  const filename: Field = {
    admin: {
      disableBulkEdit: true,
      hidden: true,
      readOnly: true,
    },
    index: true,
    label: labels['upload:fileName'],
    name: 'filename',
    type: 'text',
    unique: true,
  };

  let uploadFields: Field[] = [
    {
      ...url,
      hooks: {
        afterRead: [
          ({ data }) => {
            if (data?.filename) {
              if (uploadOptions.staticURL.startsWith('/')) {
                return `${config.serverURL}${uploadOptions.staticURL}/${data.filename}`;
              }
              return `${uploadOptions.staticURL}/${data.filename}`;
            }

            return undefined;
          },
        ],
      },
    },
    filename,
    mimeType,
    filesize,
    width,
    height,
  ];

  if (uploadOptions.mimeTypes) {
    mimeType.validate = mimeTypeValidator(uploadOptions.mimeTypes);
  }

  if (uploadOptions.imageSizes) {
    uploadFields = uploadFields.concat([
      {
        admin: {
          hidden: true,
        },
        fields: uploadOptions.imageSizes.map((size) => ({
          admin: {
            hidden: true,
          },
          fields: [
            {
              ...url,
              hooks: {
                afterRead: [
                  ({ data }) => {
                    const sizeFilename = data?.sizes?.[size.name]?.filename;

                    if (sizeFilename) {
                      if (uploadOptions.staticURL.startsWith('/')) {
                        return `${config.serverURL}${uploadOptions.staticURL}/${sizeFilename}`;
                      }
                      return `${uploadOptions.staticURL}/${sizeFilename}`;
                    }

                    return undefined;
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
          name: size.name,
          type: 'group',
        })),
        label: labels['upload:Sizes'],
        name: 'sizes',
        type: 'group',
      },
    ]);
  }
  return uploadFields;
};

export default getBaseUploadFields;

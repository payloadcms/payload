import { Field } from '../fields/config/types';
import { Config } from '../config/types';
import { CollectionConfig } from '../collections/config/types';
import { mimeTypeValidator } from './mimeTypeValidator';
import { IncomingUploadType } from './types';
import { extractTranslations } from '../translations/extractTranslations';

const labels = extractTranslations(['upload:width', 'upload:height', 'upload:fileSize', 'upload:fileName', 'upload:sizes']);

type Options = {
  config: Config
  collection: CollectionConfig
}

const getBaseUploadFields = ({ config, collection }: Options): Field[] => {
  const uploadOptions: IncomingUploadType = typeof collection.upload === 'object' ? collection.upload : {};

  const mimeType: Field = {
    name: 'mimeType',
    label: 'MIME Type',
    type: 'text',
    admin: {
      readOnly: true,
      hidden: true,
    },
  };

  const url: Field = {
    name: 'url',
    label: 'URL',
    type: 'text',
    admin: {
      readOnly: true,
      hidden: true,
    },
  };

  const width: Field = {
    name: 'width',
    label: labels['upload:width'],
    type: 'number',
    admin: {
      readOnly: true,
      hidden: true,
    },
  };

  const height: Field = {
    name: 'height',
    label: labels['upload:height'],
    type: 'number',
    admin: {
      readOnly: true,
      hidden: true,
    },
  };

  const filesize: Field = {
    name: 'filesize',
    label: labels['upload:fileSize'],
    type: 'number',
    admin: {
      readOnly: true,
      hidden: true,
    },
  };

  const filename: Field = {
    name: 'filename',
    label: labels['upload:fileName'],
    type: 'text',
    index: true,
    unique: true,
    admin: {
      readOnly: true,
      hidden: true,
      disableBulkEdit: true,
    },
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
        name: 'sizes',
        label: labels['upload:Sizes'],
        type: 'group',
        admin: {
          hidden: true,
        },
        fields: uploadOptions.imageSizes.map((size) => ({
          label: size.name,
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
        })),
      },
    ]);
  }
  return uploadFields;
};

export default getBaseUploadFields;

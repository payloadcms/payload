import { Field } from '../fields/config/types';
import { Config } from '../config/types';
import { CollectionConfig } from '../collections/config/types';
import { mimeTypeValidator } from './mimeTypeValidator';
import { IncomingUploadType } from './types';

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
      disabled: true,
    },
  };

  const url: Field = {
    name: 'url',
    label: 'URL',
    type: 'text',
    admin: {
      readOnly: true,
      disabled: true,
    },
  };

  const width: Field = {
    name: 'width',
    label: 'Width',
    type: 'number',
    admin: {
      readOnly: true,
      disabled: true,
    },
  };

  const height: Field = {
    name: 'height',
    label: 'Height',
    type: 'number',
    admin: {
      readOnly: true,
      disabled: true,
    },
  };

  const filesize: Field = {
    name: 'filesize',
    label: 'File Size',
    type: 'number',
    admin: {
      readOnly: true,
      disabled: true,
    },
  };

  const filename: Field = {
    name: 'filename',
    label: 'File Name',
    type: 'text',
    admin: {
      readOnly: true,
      disabled: true,
    },
  };

  let uploadFields: Field[] = [
    {
      ...url,
      hooks: {
        afterRead: [
          ({ data }) => {
            if (data?.filename) {
              return `${config.serverURL}${uploadOptions.staticURL}/${data.filename}`;
            }

            return undefined;
          },
        ],
      },
    },
    filename,
    mimeType,
    filesize,
  ];

  if (uploadOptions.mimeTypes) {
    mimeType.validate = mimeTypeValidator(uploadOptions.mimeTypes);
  }

  if (uploadOptions.imageSizes) {
    uploadFields = uploadFields.concat([
      width,
      height,
      {
        name: 'sizes',
        label: 'Sizes',
        type: 'group',
        admin: {
          disabled: true,
        },
        fields: uploadOptions.imageSizes.map((size) => ({
          label: size.name,
          name: size.name,
          type: 'group',
          admin: {
            disabled: true,
          },
          fields: [
            {
              ...url,
              hooks: {
                afterRead: [
                  ({ data }) => {
                    const sizeFilename = data?.sizes?.[size.name]?.filename;

                    if (sizeFilename) {
                      return `${config.serverURL}${uploadOptions.staticURL}/${sizeFilename}`;
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
            filename,
          ],
        })),
      },
    ]);
  }
  return uploadFields;
};

export default getBaseUploadFields;

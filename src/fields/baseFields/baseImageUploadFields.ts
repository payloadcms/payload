import { ImageSize } from '../../uploads/types';
import { Field } from '../config/types';

export default (imageSizes: ImageSize[]): Field[] => [
  {
    name: 'width',
    label: 'Width',
    type: 'number',
    admin: {
      readOnly: true,
      disabled: true,
    },
  }, {
    name: 'height',
    label: 'Height',
    type: 'number',
    admin: {
      readOnly: true,
      disabled: true,
    },
  },
  {
    name: 'sizes',
    label: 'Sizes',
    type: 'group',
    admin: {
      disabled: true,
    },
    fields: imageSizes.map((size) => ({
      label: size.name,
      name: size.name,
      type: 'group',
      admin: {
        disabled: true,
      },
      fields: [
        {
          name: 'width',
          label: 'Width',
          type: 'number',
          admin: {
            readOnly: true,
            disabled: true,
          },
        }, {
          name: 'height',
          label: 'Height',
          type: 'number',
          admin: {
            readOnly: true,
            disabled: true,
          },
        }, {
          name: 'mimeType',
          label: 'MIME Type',
          type: 'text',
          admin: {
            readOnly: true,
            disabled: true,
          },
        }, {
          name: 'filesize',
          label: 'File Size',
          type: 'number',
          admin: {
            readOnly: true,
            disabled: true,
          },
        }, {
          name: 'filename',
          label: 'File Name',
          type: 'text',
          admin: {
            readOnly: true,
            disabled: true,
          },
        },
      ],
    })),
  },
];

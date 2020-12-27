import { Field } from '../config/types';

export default [
  {
    name: 'filename',
    label: 'Filename',
    hooks: {
      beforeChange: [
        ({ req, operation, value }) => {
          if (operation === 'create') {
            const file = (req.files && req.files.file) ? req.files.file as { name: string } : req.file;
            return file.name;
          }

          return value;
        },
      ],
    },
    type: 'text',
    required: true,
    unique: true,
    admin: {
      disabled: true,
      readOnly: true,
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
  },
] as Field[];

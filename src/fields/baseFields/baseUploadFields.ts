import { Field } from '../config/types';

export default [
  {
    name: 'filename',
    label: 'Filename',
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

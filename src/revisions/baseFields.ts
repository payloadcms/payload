import { Field } from '../fields/config/types';

export const baseRevisionFields: Field[] = [
  {
    name: '_status',
    type: 'select',
    defaultValue: 'draft',
    access: {
      update: () => false,
    },
    options: [
      {
        label: 'Published',
        value: 'published',
      },
      {
        label: 'Draft',
        value: 'draft',
      },
    ],
    required: true,
    index: true,
    admin: {
      position: 'sidebar',
    },
  },
];

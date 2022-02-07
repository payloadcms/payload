import { Field } from '../fields/config/types';

export const statuses = [
  {
    label: 'Draft',
    value: 'draft',
  },
  {
    label: 'Published',
    value: 'published',
  },
];

const baseVersionFields: Field[] = [
  {
    name: '_status',
    label: 'Status',
    type: 'select',
    options: statuses,
    defaultValue: 'draft',
    admin: {
      components: {
        Field: () => null,
      },
    },
  },
];

export default baseVersionFields;

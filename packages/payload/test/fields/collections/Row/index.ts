import type { CollectionConfig } from '../../../../src/collections/config/types';

export const rowFieldsSlug = 'row-fields';

const RowFields: CollectionConfig = {
  slug: rowFieldsSlug,
  versions: true,
  admin: {
    defaultColumns: ['title', 'id'],
  },
  fields: [
    {
      name: 'id',
      label: 'Custom ID',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          label: 'Title within a row',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
};

export default RowFields;

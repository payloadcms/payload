import { CollectionConfig } from '../../src/collections/config/types';

const HiddenFields: CollectionConfig = {
  slug: 'hidden-fields',
  labels: {
    singular: 'Hidden Fields',
    plural: 'Hidden Fields',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title - Not Hidden',
      required: true,
    },
    {
      name: 'hiddenAdmin',
      type: 'text',
      label: 'Hidden on Admin',
      admin: {
        hidden: true,
      },
      required: true,
      defaultValue: 'should be hidden from admin, visible in API',
    },
    {
      name: 'hiddenAPI',
      type: 'text',
      label: 'Hidden on API',
      hidden: true,
      required: true,
      hooks: {
        beforeValidate: [
          ({ value }) => {
            return value || 'should be hidden from API';
          },
        ],
      },
    },
  ],
};

export default HiddenFields;

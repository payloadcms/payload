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
    },
    {
      name: 'hiddenAPI',
      type: 'text',
      label: 'Hidden on API',
      hidden: true,
      required: true, // this should not matter
    },
  ],
};

export default HiddenFields;

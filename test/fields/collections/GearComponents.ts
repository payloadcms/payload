import type { CollectionConfig } from '../../../src/collections/config/types';

const GearComponent: CollectionConfig = {
  slug: 'gear-component',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
  ],
};

export default GearComponent;

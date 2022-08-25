import type { CollectionConfig } from '../../../src/collections/config/types';
import backpopulate from '../plugins/backpopulated-relationship/hooks/backpopulate';


const GearBundle: CollectionConfig = {
  slug: 'gear-bundle',
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
    {
      name: 'gear_components',
      type: 'relationship',
      relationTo: ['gear-component'],
      hasMany: true,
      hooks: {
        afterChange: [backpopulate],
      },
    },
  ],
};

export default GearBundle;

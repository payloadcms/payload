import type { CollectionConfig } from '../../../src/collections/config/types';


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
        afterChange: [
          ({
            value,
            originalDoc,
            previousDoc,
          }) => {
            console.log('ac value', value);
            console.log('ac originalDoc', originalDoc);
            console.log('ac previousDoc', previousDoc);

            return;
          },
        ],
      }
    },
  ],
};

export default GearBundle;

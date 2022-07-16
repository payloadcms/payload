import type { CollectionConfig } from '../../../../src/collections/config/types';

const PointFields: CollectionConfig = {
  slug: 'point-fields',
  admin: {
    useAsTitle: 'point',
  },
  fields: [
    {
      name: 'point',
      type: 'point',
      label: 'Location',
      required: true,
    },
    {
      name: 'localized',
      type: 'point',
      label: 'Localized Point',
      localized: true,
    },
    {
      type: 'group',
      name: 'group',
      fields: [
        {
          name: 'point',
          type: 'point',
        },
      ],
    },
  ],
};

export const pointDoc = {
  point: [7, -7],
  localized: [5, -2],
  group: { point: [1, 9] },
};


export default PointFields;

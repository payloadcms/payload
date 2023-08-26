import type { CollectionConfig } from '../../../../../src/collections/config/types';

export const pointFieldsSlug = 'point-fields';

const PointFields: CollectionConfig = {
  slug: pointFieldsSlug,
  admin: {
    useAsTitle: 'point',
  },
  versions: true,
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
      unique: true,
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
  localized: [15, -12],
  group: { point: [1, 9] },
};

export default PointFields;

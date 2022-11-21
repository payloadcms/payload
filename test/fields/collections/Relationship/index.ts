import type { CollectionConfig } from '../../../../src/collections/config/types';
import { PrePopulateFieldUI } from './PrePopulateFieldUI';

export const relationshipFieldsSlug = 'relationship-fields';

const RelationshipFields: CollectionConfig = {
  slug: relationshipFieldsSlug,
  fields: [
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: ['text-fields', 'array-fields'],
      required: true,
    },
    {
      name: 'relationToSelf',
      type: 'relationship',
      relationTo: relationshipFieldsSlug,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'relationPrePopulate',
          type: 'relationship',
          relationTo: 'text-fields',
          admin: {
            width: '75%',
          },
        },
        {
          type: 'ui',
          name: 'prePopulate',
          admin: {
            width: '25%',
            components: {
              Field: () => PrePopulateFieldUI({ path: 'relationPrePopulate', hasMany: false }),
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'relationHasMany',
          type: 'relationship',
          relationTo: 'text-fields',
          hasMany: true,
          admin: {
            width: '75%',
          },
        },
        {
          type: 'ui',
          name: 'prePopulate',
          admin: {
            width: '25%',
            components: {
              Field: () => PrePopulateFieldUI({ path: 'relationHasMany', hasMultipleRelations: false }),
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'relationToManyHasMany',
          type: 'relationship',
          relationTo: ['text-fields', 'array-fields'],
          hasMany: true,
          admin: {
            width: '75%',
          },
        },
        {
          type: 'ui',
          name: 'prePopulateToMany',
          admin: {
            width: '25%',
            components: {
              Field: () => PrePopulateFieldUI({ path: 'relationToManyHasMany', hasMultipleRelations: true }),
            },
          },
        },
      ],
    },
  ],
};

export default RelationshipFields;

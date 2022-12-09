import type { CollectionConfig } from '../../../../src/collections/config/types';
import { FilterOptionsProps } from '../../../../src/fields/config/types';

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
      name: 'narrowRelationsBy',
      type: 'select',
      options: ['text-fields', 'array-fields'],
    },
    {
      name: 'relationshipMany',
      type: 'relationship',
      relationTo: ['text-fields', 'array-fields'],
      hasMany: true,
      filterOptions: ({ relationTo, siblingData }: any) => {
        if (siblingData?.narrowRelationsBy === relationTo) {
          return { and: [] };
        }

        return {
          and: [
            {
              nonexistentField: {
                exists: true,
              },
            },
          ],
        };
      },
    },
  ],
};

export default RelationshipFields;

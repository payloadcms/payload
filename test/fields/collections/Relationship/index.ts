import type { CollectionConfig } from '../../../../src/collections/config/types';

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
      name: 'relationToSelfSelectOnly',
      type: 'relationship',
      relationTo: relationshipFieldsSlug,
      admin: {
        allowCreate: false,
      },
    },
  ],
};

export default RelationshipFields;

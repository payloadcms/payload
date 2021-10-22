import { Field } from '../fields/config/types';
import { SanitizedCollectionConfig } from '../collections/config/types';

export const buildRevisionFields = (collection: SanitizedCollectionConfig): Field[] => [
  {
    name: 'parent',
    type: 'relationship',
    index: true,
    relationTo: collection.slug,
  },
  {
    name: 'revision',
    type: 'group',
    fields: collection.fields,
  },
];

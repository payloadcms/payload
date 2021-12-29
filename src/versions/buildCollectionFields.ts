import { Field } from '../fields/config/types';
import { SanitizedCollectionConfig } from '../collections/config/types';

export const buildVersionCollectionFields = (collection: SanitizedCollectionConfig): Field[] => [
  {
    name: 'parent',
    type: 'relationship',
    index: true,
    relationTo: collection.slug,
  },
  {
    name: 'autosave',
    type: 'checkbox',
    index: true,
  },
  {
    name: 'version',
    type: 'group',
    fields: collection.fields,
  },
];

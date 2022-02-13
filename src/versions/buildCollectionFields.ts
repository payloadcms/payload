import { Field } from '../fields/config/types';
import { SanitizedCollectionConfig } from '../collections/config/types';

export const buildVersionCollectionFields = (collection: SanitizedCollectionConfig): Field[] => {
  const fields: Field[] = [
    {
      name: 'parent',
      type: 'relationship',
      index: true,
      relationTo: collection.slug,
    },
    {
      name: 'version',
      type: 'group',
      fields: collection.fields,
    },
  ];

  if (collection?.versions?.drafts && collection?.versions?.drafts?.autosave) {
    fields.push({
      name: 'autosave',
      type: 'checkbox',
      index: true,
    });
  }

  return fields;
};

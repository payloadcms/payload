import type { SanitizedCollectionConfig } from '../collections/config/types';
import type { Field } from '../fields/config/types';

export const buildVersionCollectionFields = (collection: SanitizedCollectionConfig): Field[] => {
  const fields: Field[] = [
    {
      index: true,
      name: 'parent',
      relationTo: collection.slug,
      type: 'relationship',
    },
    {
      fields: collection.fields,
      name: 'version',
      type: 'group',
    },
    {
      admin: {
        disabled: true,
      },
      index: true,
      name: 'createdAt',
      type: 'date',
    },
    {
      admin: {
        disabled: true,
      },
      index: true,
      name: 'updatedAt',
      type: 'date',
    },
  ];

  if (collection?.versions?.drafts && collection?.versions?.drafts?.autosave) {
    fields.push({
      index: true,
      name: 'autosave',
      type: 'checkbox',
    });
  }

  return fields;
};

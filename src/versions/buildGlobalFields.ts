import { Field } from '../fields/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';

export const buildVersionGlobalFields = (global: SanitizedGlobalConfig): Field[] => {
  const fields: Field[] = [
    {
      name: 'version',
      type: 'group',
      fields: global.fields,
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        disabled: true,
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        disabled: true,
      },
    },
  ];

  if (global?.versions?.drafts && global?.versions?.drafts?.autosave) {
    fields.push({
      name: 'autosave',
      type: 'checkbox',
      index: true,
    });
  }

  return fields;
};

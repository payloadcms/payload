import type { Field } from '../fields/config/types'
import type { SanitizedGlobalConfig } from '../globals/config/types'

export const buildVersionGlobalFields = (global: SanitizedGlobalConfig): Field[] => {
  const fields: Field[] = [
    {
      fields: global.fields,
      name: 'version',
      type: 'group',
    },
    {
      admin: {
        disabled: true,
      },
      name: 'createdAt',
      type: 'date',
    },
    {
      admin: {
        disabled: true,
      },
      name: 'updatedAt',
      type: 'date',
    },
  ]

  if (global?.versions?.drafts) {
    fields.push({
      name: 'latest',
      type: 'checkbox',
      index: true,
      admin: {
        disabled: true,
      },
    });
  }

  if (global?.versions?.drafts && global?.versions?.drafts?.autosave) {
    fields.push({
      index: true,
      name: 'autosave',
      type: 'checkbox',
    })
  }

  return fields
}

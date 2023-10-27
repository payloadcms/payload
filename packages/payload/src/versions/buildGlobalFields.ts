import type { Field } from '../fields/config/types'
import type { SanitizedGlobalConfig } from '../globals/config/types'

export const buildVersionGlobalFields = (global: SanitizedGlobalConfig): Field[] => {
  const globalFields: Field[] = [
    ...global.fields,
    {
      name: 'globalType',
      admin: {
        disabled: true,
      },
      type: 'text',
    },
  ]

  const fields: Field[] = [
    {
      name: 'version',
      fields: globalFields,
      type: 'group',
    },
    {
      name: 'createdAt',
      admin: {
        disabled: true,
      },
      type: 'date',
    },
    {
      name: 'updatedAt',
      admin: {
        disabled: true,
      },
      type: 'date',
    },
  ]

  if (global?.versions?.drafts) {
    fields.push({
      name: 'latest',
      admin: {
        disabled: true,
      },
      index: true,
      type: 'checkbox',
    })
  }

  if (global?.versions?.drafts && global?.versions?.drafts?.autosave) {
    fields.push({
      name: 'autosave',
      index: true,
      type: 'checkbox',
    })
  }

  return fields
}

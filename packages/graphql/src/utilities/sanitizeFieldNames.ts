import type { Field } from 'payload'

import { formatName } from './formatName.js'

export const sanitizeFieldNames = (fields: Field[]): Field[] => {
  return fields.map((field) => {
    if ('name' in field) {
      field.name = formatName(field.name)
    }

    if (
      field.type === 'row' ||
      field.type === 'array' ||
      field.type === 'collapsible' ||
      field.type === 'group'
    ) {
      field.fields = sanitizeFieldNames(field.fields)
    }

    if (field.type === 'blocks') {
      field.blocks.forEach((block) => {
        block.fields = sanitizeFieldNames(block.fields)
      })
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        if ('name' in tab) {
          tab.name = formatName(tab.name)
        }
        tab.fields = sanitizeFieldNames(tab.fields)
      })
    }

    return field
  })
}

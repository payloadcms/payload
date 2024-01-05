import type { Block, Field } from 'payload/types'

import { InvalidConfiguration } from 'payload/errors'
import { fieldAffectsData, fieldHasSubFields, tabHasName } from 'payload/types'

import type { GenericTable } from '../types'

type Args = {
  block: Block
  localized: boolean
  rootTableName: string
  table: GenericTable
}

const getFlattenedFieldNames = (fields: Field[], prefix: string = ''): string[] => {
  return fields.reduce((fieldsToUse, field) => {
    let fieldPrefix = prefix

    if (fieldHasSubFields(field)) {
      fieldPrefix = 'name' in field ? `${prefix}${field.name}.` : prefix
      return [...fieldsToUse, ...getFlattenedFieldNames(field.fields, fieldPrefix)]
    }

    if (field.type === 'tabs') {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce((tabFields, tab) => {
          fieldPrefix = 'name' in tab ? `${prefix}.${tab.name}` : prefix
          return [
            ...tabFields,
            ...(tabHasName(tab)
              ? [{ ...tab, type: 'tab' }]
              : getFlattenedFieldNames(tab.fields, fieldPrefix)),
          ]
        }, []),
      ]
    }

    if (fieldAffectsData(field)) {
      return [...fieldsToUse, `${fieldPrefix?.replace('.', '_') || ''}${field.name}`]
    }

    return fieldsToUse
  }, [])
}

export const validateExistingBlockIsIdentical = ({
  block,
  localized,
  rootTableName,
  table,
}: Args): void => {
  if (table) {
    const fieldNames = getFlattenedFieldNames(block.fields)

    Object.keys(table).forEach((fieldName) => {
      if (!['_locale', '_order', '_parentID', '_path', '_uuid'].includes(fieldName)) {
        if (fieldNames.indexOf(fieldName) === -1) {
          throw new InvalidConfiguration(
            `The table ${rootTableName} has multiple blocks with slug ${block.slug}, but the schemas do not match. One block includes the field ${fieldName}, while the other block does not.`,
          )
        }
      }
    })

    if (Boolean(localized) !== Boolean(table._locale)) {
      throw new InvalidConfiguration(
        `The table ${rootTableName} has multiple blocks with slug ${block.slug}, but the schemas do not match. One is localized, but another is not. Block schemas of the same name must match exactly.`,
      )
    }
  }
}

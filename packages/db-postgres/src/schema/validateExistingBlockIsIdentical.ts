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

    if (
      ['array', 'blocks', 'relationship', 'upload'].includes(field.type) ||
      ('hasMany' in field && field.hasMany === true)
    ) {
      return fieldsToUse
    }

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
  const fieldNames = getFlattenedFieldNames(block.fields)

  const missingField =
    // ensure every field from the config is in the matching table
    fieldNames.find((name) => Object.keys(table).indexOf(name) === -1) ||
    // ensure every table column is matched for every field from the config
    Object.keys(table).find((fieldName) => {
      if (!['_locale', '_order', '_parentID', '_path', '_uuid'].includes(fieldName)) {
        return fieldNames.indexOf(fieldName) === -1
      }
    })

  if (missingField) {
    throw new InvalidConfiguration(
      `The table ${rootTableName} has multiple blocks with slug ${block.slug}, but the schemas do not match. One block includes the field ${missingField}, while the other block does not.`,
    )
  }

  if (Boolean(localized) !== Boolean(table._locale)) {
    throw new InvalidConfiguration(
      `The table ${rootTableName} has multiple blocks with slug ${block.slug}, but the schemas do not match. One is localized, but another is not. Block schemas of the same name must match exactly.`,
    )
  }
}

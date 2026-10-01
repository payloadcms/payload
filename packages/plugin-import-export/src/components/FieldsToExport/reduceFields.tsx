import type { I18nClient } from '@payloadcms/translations'
import type { ClientField } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { fieldAffectsData, fieldHasSubFields } from 'payload/shared'
import React, { Fragment } from 'react'

export type ReducedField = {
  /** Translated, prefix-aware label as plain text, e.g. `Group > Title` */
  displayLabel: string
  /** Translated label of the field itself without any parent prefix */
  fieldLabel: string
  id: string
  label: React.ReactNode
  value: string
}

const createNestedClientFieldPath = (parentPath: string, field: ClientField): string => {
  if (parentPath) {
    if (fieldAffectsData(field)) {
      return `${parentPath}.${field.name}`
    }
    return parentPath
  }

  if (fieldAffectsData(field)) {
    return field.name
  }

  return ''
}

const getFieldLabel = ({ field, i18n }: { field: ClientField; i18n?: I18nClient }): string => {
  if ('label' in field && field.label) {
    if (typeof field.label === 'string') {
      return field.label
    }
    if (i18n && typeof field.label === 'object') {
      return getTranslation(field.label, i18n)
    }
  }

  return ('name' in field && field.name) || ''
}

const combineLabelText = ({
  field,
  i18n,
  prefix,
}: {
  field: ClientField
  i18n?: I18nClient
  prefix?: string
}): string => {
  const label = getFieldLabel({ field, i18n })

  if (prefix && label) {
    return `${prefix} > ${label}`
  }

  return prefix || label
}

const combineLabel = ({
  field,
  i18n,
  prefix,
}: {
  field: ClientField
  i18n?: I18nClient
  prefix?: string
}): React.ReactNode => {
  return (
    <Fragment>
      {prefix ? (
        <Fragment>
          <span style={{ display: 'inline-block' }}>{prefix}</span>
          {' > '}
        </Fragment>
      ) : null}
      <span style={{ display: 'inline-block' }}>
        {getFieldLabel({ field, i18n }) || 'unnamed field'}
      </span>
    </Fragment>
  )
}

export const reduceFields = ({
  disabledFields = [],
  excludeUnsortable = false,
  fields,
  i18n,
  labelPrefix = '',
  path = '',
}: {
  disabledFields?: string[]
  excludeUnsortable?: boolean
  fields: ClientField[]
  /**
   * When provided, localized field labels (`{ en: 'Title', de: 'Titel' }`) are
   * translated into the current admin language instead of falling back to the field name.
   */
  i18n?: I18nClient
  labelPrefix?: string
  path?: string
}): ReducedField[] => {
  if (!fields) {
    return []
  }

  return fields.reduce<ReducedField[]>((fieldsToUse, field) => {
    const isArrayOrBlocks = field.type === 'array' || field.type === 'blocks'

    // escape for a variety of reasons, include ui fields as they have `name`.
    if (field.type === 'ui' || (excludeUnsortable && isArrayOrBlocks)) {
      return fieldsToUse
    }

    if (!isArrayOrBlocks && fieldHasSubFields(field)) {
      return [
        ...fieldsToUse,
        ...reduceFields({
          disabledFields,
          excludeUnsortable,
          fields: field.fields,
          i18n,
          labelPrefix: combineLabelText({ field, i18n, prefix: labelPrefix }),
          path: createNestedClientFieldPath(path, field),
        }),
      ]
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce<ReducedField[]>((tabFields, tab) => {
          if ('fields' in tab) {
            const isNamedTab = 'name' in tab && tab.name

            const newPath = isNamedTab ? `${path}${path ? '.' : ''}${tab.name}` : path

            return [
              ...tabFields,
              ...reduceFields({
                disabledFields,
                excludeUnsortable,
                fields: tab.fields,
                i18n,
                labelPrefix: isNamedTab
                  ? combineLabelText({
                      field: {
                        name: tab.name,
                        label: tab.label ?? tab.name,
                      } as any,
                      i18n,
                      prefix: labelPrefix,
                    })
                  : labelPrefix,
                path: newPath,
              }),
            ]
          }
          return tabFields
        }, []),
      ]
    }

    const val = createNestedClientFieldPath(path, field)

    // If the field is disabled, skip it
    if (
      disabledFields.some(
        (disabledField) => val === disabledField || val.startsWith(`${disabledField}.`),
      )
    ) {
      return fieldsToUse
    }

    const formattedField: ReducedField = {
      id: val,
      displayLabel: combineLabelText({ field, i18n, prefix: labelPrefix }) || val,
      fieldLabel: getFieldLabel({ field, i18n }) || val,
      label: combineLabel({ field, i18n, prefix: labelPrefix }),
      value: val,
    }

    return [...fieldsToUse, formattedField]
  }, [])
}

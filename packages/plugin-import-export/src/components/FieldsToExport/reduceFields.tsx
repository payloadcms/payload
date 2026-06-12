import type { ClientField } from 'payload'

import { fieldAffectsData, fieldHasSubFields } from 'payload/shared'
import React, { Fragment } from 'react'

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

const combineLabel = ({
  field,
  prefix,
}: {
  field: ClientField
  prefix?: React.ReactNode
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
        {'label' in field && typeof field.label === 'string'
          ? field.label
          : (('name' in field && field.name) ?? 'unnamed field')}
      </span>
    </Fragment>
  )
}

export const reduceFields = ({
  disabledFields = [],
  excludeUnsortable = false,
  fields,
  labelPrefix = null,
  path = '',
}: {
  disabledFields?: string[]
  excludeUnsortable?: boolean
  fields: ClientField[]
  labelPrefix?: React.ReactNode
  path?: string
}): { id: string; label: React.ReactNode; value: string }[] => {
  if (!fields) {
    return []
  }

  return fields.reduce<{ id: string; label: React.ReactNode; value: string }[]>(
    (fieldsToUse, field) => {
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
            labelPrefix: combineLabel({ field, prefix: labelPrefix }),
            path: createNestedClientFieldPath(path, field),
          }),
        ]
      }

      if (field.type === 'tabs' && 'tabs' in field) {
        return [
          ...fieldsToUse,
          ...field.tabs.reduce<{ id: string; label: React.ReactNode; value: string }[]>(
            (tabFields, tab) => {
              if ('fields' in tab) {
                const isNamedTab = 'name' in tab && tab.name

                const newPath = isNamedTab ? `${path}${path ? '.' : ''}${tab.name}` : path

                return [
                  ...tabFields,
                  ...reduceFields({
                    disabledFields,
                    excludeUnsortable,
                    fields: tab.fields,
                    labelPrefix: isNamedTab
                      ? combineLabel({
                          field: {
                            name: tab.name,
                            label: tab.label ?? tab.name,
                          } as any,
                          prefix: labelPrefix,
                        })
                      : labelPrefix,
                    path: newPath,
                  }),
                ]
              }
              return tabFields
            },
            [],
          ),
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

      const formattedField = {
        id: val,
        label: combineLabel({ field, prefix: labelPrefix }),
        value: val,
      }

      return [...fieldsToUse, formattedField]
    },
    [],
  )
}

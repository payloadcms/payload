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
  fields,
  labelPrefix = null,
  path = '',
}: {
  fields: ClientField[]
  labelPrefix?: React.ReactNode
  path?: string
}): { id: string; label: React.ReactNode; value: string }[] => {
  if (!fields) {
    return []
  }

  return fields.reduce<{ id: string; label: React.ReactNode; value: string }[]>(
    (fieldsToUse, field) => {
      // escape for a variety of reasons, include ui fields as they have `name`.
      if (field.type === 'ui') {
        return fieldsToUse
      }

      if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
        return [
          ...fieldsToUse,
          ...reduceFields({
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
                return [
                  ...tabFields,
                  ...reduceFields({
                    fields: tab.fields,
                    labelPrefix,
                    path: isNamedTab ? createNestedClientFieldPath(path, field) : path,
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

import type { ClientField, FieldWithPathClient, FormState } from 'payload'

import { fieldAffectsData, fieldHasSubFields, fieldIsHiddenOrDisabled } from 'payload/shared'

import { createNestedClientFieldPath } from '../../forms/Form/createNestedClientFieldPath.js'
import { combineFieldLabel } from '../../utilities/combineFieldLabel.js'

export type SelectedField = {
  path: string
}

export type FieldOption = {
  label: React.ReactNode
  value: SelectedField
}

export const ignoreFromBulkEdit = (field: ClientField): boolean =>
  Boolean(
    (fieldAffectsData(field) || field.type === 'ui') &&
      (field.admin.disableBulkEdit ||
        field.unique ||
        fieldIsHiddenOrDisabled(field) ||
        ('readOnly' in field && field.readOnly)),
  )

export const reduceFieldOptions = ({
  fields,
  formState,
  labelPrefix = null,
  path = '',
}: {
  fields: ClientField[]
  formState?: FormState
  labelPrefix?: React.ReactNode
  path?: string
}): { Label: React.ReactNode; value: FieldWithPathClient }[] => {
  if (!fields) {
    return []
  }

  const CustomLabel = formState?.[path]?.customComponents?.Label

  return fields?.reduce((fieldsToUse, field) => {
    // escape for a variety of reasons, include ui fields as they have `name`.
    if (
      (fieldAffectsData(field) || field.type === 'ui') &&
      (field.admin?.disableBulkEdit ||
        field.unique ||
        fieldIsHiddenOrDisabled(field) ||
        ('readOnly' in field && field.readOnly))
    ) {
      return fieldsToUse
    }

    if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
      return [
        ...fieldsToUse,
        ...reduceFieldOptions({
          fields: field.fields,
          labelPrefix: combineFieldLabel({ CustomLabel, field, prefix: labelPrefix }),
          path: createNestedClientFieldPath(path, field),
        }),
      ]
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce((tabFields, tab) => {
          if ('fields' in tab) {
            const isNamedTab = 'name' in tab && tab.name
            return [
              ...tabFields,
              ...reduceFieldOptions({
                fields: tab.fields,
                labelPrefix,
                path: isNamedTab ? createNestedClientFieldPath(path, field) : path,
              }),
            ]
          }
        }, []),
      ]
    }

    const formattedField = {
      label: combineFieldLabel({ CustomLabel, field, prefix: labelPrefix }),
      value: {
        ...field,
        path: createNestedClientFieldPath(path, field),
      },
    }

    return [...fieldsToUse, formattedField]
  }, [])
}

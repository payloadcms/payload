import type { ClientField, FormState, SanitizedFieldPermissions } from 'payload'

import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsHiddenOrDisabled,
  getFieldPermissions,
} from 'payload/shared'

import { createNestedClientFieldPath } from '../../forms/Form/createNestedClientFieldPath.js'
import { combineFieldLabel } from '../../utilities/combineFieldLabel.js'

export type SelectedField = {
  field: ClientField
  fieldPermissions: SanitizedFieldPermissions
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
  parentPath = '',
  path = '',
  permissions,
}: {
  readonly fields: ClientField[]
  readonly formState?: FormState
  readonly labelPrefix?: React.ReactNode
  readonly parentPath?: string
  readonly path?: string
  readonly permissions:
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
    | SanitizedFieldPermissions
}): FieldOption[] => {
  if (!fields) {
    return []
  }

  const CustomLabel = formState?.[path]?.customComponents?.Label

  return fields?.reduce((fieldsToUse, field) => {
    const {
      operation: hasOperationPermission,
      permissions: fieldPermissions,
      read: hasReadPermission,
    } = getFieldPermissions({
      field,
      operation: 'update',
      parentName: parentPath?.includes('.')
        ? parentPath.split('.')[parentPath.split('.').length - 1]
        : parentPath,
      permissions,
    })

    // escape for a variety of reasons, include ui fields as they have `name`.
    if (
      (fieldAffectsData(field) || field.type === 'ui') &&
      (field.admin?.disableBulkEdit ||
        field.unique ||
        fieldIsHiddenOrDisabled(field) ||
        ('readOnly' in field && field.readOnly) ||
        !hasOperationPermission ||
        !hasReadPermission)
    ) {
      return fieldsToUse
    }

    if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
      return [
        ...fieldsToUse,
        ...reduceFieldOptions({
          fields: field.fields,
          labelPrefix: combineFieldLabel({ CustomLabel, field, prefix: labelPrefix }),
          parentPath: path,
          path: createNestedClientFieldPath(path, field),
          permissions: fieldPermissions,
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
                parentPath: path,
                path: isNamedTab ? createNestedClientFieldPath(path, field) : path,
                permissions: fieldPermissions,
              }),
            ]
          }
        }, []),
      ]
    }

    const formattedField: FieldOption = {
      label: combineFieldLabel({ CustomLabel, field, prefix: labelPrefix }),
      value: {
        field,
        fieldPermissions,
        path: createNestedClientFieldPath(path, field),
      },
    }

    return [...fieldsToUse, formattedField]
  }, [])
}

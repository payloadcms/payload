import type { I18nClient } from '@payloadcms/translations'
import type { ClientField, FormState, SanitizedFieldPermissions } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  fieldAffectsData,
  fieldHasSubFields,
  fieldIsHiddenOrDisabled,
  getFieldPermissions,
  isFieldDisabled,
  toWords,
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
  plainTextLabel: string
  value: SelectedField
}

const getPlainTextFieldLabel = (field: ClientField, i18n?: I18nClient): string => {
  if ('label' in field && field.label) {
    if (typeof field.label === 'string') {
      return field.label
    }

    if (i18n) {
      return getTranslation(field.label, i18n)
    }
  }

  return 'name' in field && field.name ? toWords(field.name) : ''
}

export const ignoreFromBulkEdit = (field: ClientField): boolean =>
  Boolean(
    (fieldAffectsData(field) || field.type === 'ui') &&
      (isFieldDisabled(field, 'bulkEdit') ||
        field.unique ||
        fieldIsHiddenOrDisabled(field) ||
        ('readOnly' in field && field.readOnly)),
  )

export const reduceFieldOptions = ({
  fields,
  formState,
  i18n,
  labelPrefix = null,
  parentPath = '',
  path = '',
  permissions,
  plainTextLabelPrefix = '',
}: {
  readonly fields: ClientField[]
  readonly formState?: FormState
  readonly i18n?: I18nClient
  readonly labelPrefix?: React.ReactNode
  readonly parentPath?: string
  readonly path?: string
  readonly permissions:
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
    | SanitizedFieldPermissions
  readonly plainTextLabelPrefix?: string
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
      (isFieldDisabled(field, 'bulkEdit') ||
        field.unique ||
        fieldIsHiddenOrDisabled(field) ||
        ('readOnly' in field && field.readOnly) ||
        !hasOperationPermission ||
        !hasReadPermission)
    ) {
      return fieldsToUse
    }

    if (!(field.type === 'array' || field.type === 'blocks') && fieldHasSubFields(field)) {
      const fieldHasLabel = 'label' in field && field.label
      const fieldPlainTextLabel = getPlainTextFieldLabel(field, i18n)
      return [
        ...fieldsToUse,
        ...reduceFieldOptions({
          fields: field.fields,
          i18n,
          labelPrefix: fieldHasLabel
            ? combineFieldLabel({ CustomLabel, field, prefix: labelPrefix })
            : labelPrefix,
          parentPath: path,
          path: createNestedClientFieldPath(path, field),
          permissions: fieldPermissions,
          plainTextLabelPrefix: fieldHasLabel
            ? [plainTextLabelPrefix, fieldPlainTextLabel].filter(Boolean).join(' > ')
            : plainTextLabelPrefix,
        }),
      ]
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      return [
        ...fieldsToUse,
        ...field.tabs.reduce((tabFields, tab) => {
          if ('fields' in tab) {
            const isNamedTab = 'name' in tab && tab.name

            const namedTabPermissions =
              isNamedTab && fieldPermissions && fieldPermissions !== true
                ? fieldPermissions[tab.name]
                : undefined

            const tabPermissions = isNamedTab
              ? namedTabPermissions === true
                ? true
                : (namedTabPermissions?.fields ?? fieldPermissions)
              : fieldPermissions

            return [
              ...tabFields,
              ...reduceFieldOptions({
                fields: tab.fields,
                i18n,
                labelPrefix,
                parentPath: path,
                path: isNamedTab ? createNestedClientFieldPath(path, tab as ClientField) : path,
                permissions: tabPermissions,
                plainTextLabelPrefix,
              }),
            ]
          }
        }, []),
      ]
    }

    const formattedField: FieldOption = {
      label: combineFieldLabel({ CustomLabel, field, prefix: labelPrefix }),
      plainTextLabel: [plainTextLabelPrefix, getPlainTextFieldLabel(field, i18n)]
        .filter(Boolean)
        .join(' > '),
      value: {
        field,
        fieldPermissions: fieldPermissions as SanitizedFieldPermissions,
        path: createNestedClientFieldPath(path, field),
      },
    }

    return [...fieldsToUse, formattedField]
  }, [])
}

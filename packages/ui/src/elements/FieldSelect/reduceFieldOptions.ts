import type { ClientField, FormState } from 'payload'

import {
  fieldAffectsData,
  fieldIsHiddenOrDisabled,
  getFieldPaths,
  tabHasName,
} from 'payload/shared'

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
  parentIndexPath,
  parentPath,
  parentSchemaPath,
}: {
  fields: ClientField[]
  formState?: FormState
  labelPrefix?: React.ReactNode
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
}): FieldOption[] => {
  if (!fields) {
    return []
  }

  return fields?.reduce(
    (acc, field, fieldIndex) => {
      if (ignoreFromBulkEdit(field)) {
        return acc
      }

      const { indexPath, path, schemaPath } = getFieldPaths({
        field,
        index: fieldIndex,
        parentIndexPath: 'name' in field ? '' : parentIndexPath,
        parentPath,
        parentSchemaPath,
      })

      const CustomLabel = formState?.[path]?.customComponents?.Label

      switch (field.type) {
        case 'group':
        case 'row': {
          acc.push(
            ...reduceFieldOptions({
              fields: field.fields,
              labelPrefix: combineFieldLabel({ CustomLabel, field, prefix: labelPrefix }),
              parentIndexPath: indexPath,
              parentPath: path,
              parentSchemaPath: schemaPath,
            }),
          )

          return acc
        }

        case 'tabs': {
          acc.push(
            ...field.tabs.reduce((tabFields, tab, tabIndex) => {
              const isNamedTab = tabHasName(tab)

              const {
                indexPath: tabIndexPath,
                path: tabPath,
                schemaPath: tabSchemaPath,
              } = getFieldPaths({
                field: {
                  ...tab,
                  type: 'tab',
                },
                index: tabIndex,
                parentIndexPath: indexPath,
                parentPath,
                parentSchemaPath,
              })

              return [
                ...tabFields,
                ...reduceFieldOptions({
                  fields: tab.fields,
                  labelPrefix,
                  parentIndexPath: isNamedTab ? '' : tabIndexPath,
                  parentPath: isNamedTab ? tabPath : parentPath,
                  parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
                }),
              ]
            }, []),
          )

          return acc
        }

        default: {
          acc.push({
            label: combineFieldLabel({ CustomLabel, field, prefix: labelPrefix }),
            value: {
              path,
            },
          })

          return acc
        }
      }
    },
    [] as {
      label: React.ReactNode
      value: SelectedField
    }[],
  )
}

import type { ClientField, FormState } from 'payload'

import {
  fieldAffectsData,
  fieldIsHiddenOrDisabled,
  getFieldPaths,
  tabHasName,
} from 'payload/shared'

import { combineLabel } from './index.js'

export type FieldOption = {
  label: React.ReactNode
  value: string
}

export const reduceSelectableFields = ({
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
      // escape for a variety of reasons, include ui fields as they have `name`.
      if (
        (fieldAffectsData(field) || field.type === 'ui') &&
        (field.admin.disableBulkEdit ||
          field.unique ||
          fieldIsHiddenOrDisabled(field) ||
          ('readOnly' in field && field.readOnly))
      ) {
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
            ...reduceSelectableFields({
              fields: field.fields,
              labelPrefix: combineLabel({ CustomLabel, field, prefix: labelPrefix }),
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
              if ('fields' in tab) {
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
                  ...reduceSelectableFields({
                    fields: tab.fields,
                    labelPrefix,
                    parentIndexPath: isNamedTab ? '' : tabIndexPath,
                    parentPath: isNamedTab ? tabPath : parentPath,
                    parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
                  }),
                ]
              }
            }, []),
          )

          return acc
        }

        default: {
          acc.push({
            label: combineLabel({ CustomLabel, field, prefix: labelPrefix }),
            value: path,
          })

          return acc
        }
      }
    },
    [] as {
      label: React.ReactNode
      value: string
    }[],
  )
}

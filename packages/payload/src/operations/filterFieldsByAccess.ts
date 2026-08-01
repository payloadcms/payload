import type { SanitizedDocumentPermissions, SanitizedFieldsPermissions } from '../auth/types.js'
import type { FlattenedBlock, FlattenedField } from '../fields/config/types.js'
import type { Operation } from '../types/index.js'

type FieldOperation = Exclude<Operation, 'delete'>
type AllowedFieldOperations = Record<FieldOperation, boolean>

/**
 * Applies document/field permissions to a flattened entity schema before exposing its input
 * contract through an external adapter.
 */
export const filterFieldsByAccess = ({
  blocks,
  fields,
  permissions,
  shouldExcludeField,
}: {
  blocks?: FlattenedBlock[]
  fields: FlattenedField[]
  permissions: SanitizedDocumentPermissions
  shouldExcludeField: (allowedOperations: AllowedFieldOperations) => boolean
}): FlattenedField[] => {
  const filterFields = (
    nestedFields: FlattenedField[],
    nestedPermissions: SanitizedFieldsPermissions | undefined,
    parentAllowedOperations: AllowedFieldOperations,
  ): FlattenedField[] => {
    const accessibleFields: FlattenedField[] = []

    for (const field of nestedFields) {
      const fieldPermissions = nestedPermissions === true ? true : nestedPermissions?.[field.name]
      const isOperationAllowed = (operation: FieldOperation): boolean =>
        parentAllowedOperations[operation] &&
        (fieldPermissions === true || fieldPermissions?.[operation] === true)
      const allowedOperations: AllowedFieldOperations = {
        create: isOperationAllowed('create'),
        read: isOperationAllowed('read'),
        update: isOperationAllowed('update'),
      }

      if (shouldExcludeField(allowedOperations)) {
        continue
      }

      if (field.type === 'blocks') {
        const accessibleBlocks: (FlattenedBlock | string)[] = []

        for (const blockOrReference of field.blocks) {
          const block =
            typeof blockOrReference === 'string'
              ? blocks?.find(({ slug }) => slug === blockOrReference)
              : blockOrReference

          if (!block) {
            continue
          }

          const blockPermissions =
            fieldPermissions === true
              ? true
              : fieldPermissions?.blocks === true
                ? true
                : fieldPermissions?.blocks?.[block.slug]

          accessibleBlocks.push({
            ...block,
            flattenedFields: filterFields(
              block.flattenedFields,
              blockPermissions === true ? true : blockPermissions?.fields,
              allowedOperations,
            ),
          })
        }

        if (accessibleBlocks.length === 0) {
          continue
        }

        accessibleFields.push({ ...field, blocks: accessibleBlocks })
        continue
      }

      if (field.type === 'array' || field.type === 'group' || field.type === 'tab') {
        accessibleFields.push({
          ...field,
          flattenedFields: filterFields(
            field.flattenedFields,
            fieldPermissions === true ? true : fieldPermissions?.fields,
            allowedOperations,
          ),
        })
        continue
      }

      accessibleFields.push(field)
    }

    return accessibleFields
  }

  return filterFields(fields, permissions.fields, {
    create: 'create' in permissions && permissions.create === true,
    read: permissions.read === true,
    update: permissions.update === true,
  })
}

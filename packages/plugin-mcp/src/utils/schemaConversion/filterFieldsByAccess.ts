import type {
  FlattenedBlock,
  FlattenedField,
  Operation,
  SanitizedDocumentPermissions,
  SanitizedFieldsPermissions,
} from 'payload'

type FieldOperation = Exclude<Operation, 'delete'>
type AllowedFieldOperations = Record<FieldOperation, boolean>

/**
 * Filters fields using the access results in `permissions`. `shouldExcludeField` receives the
 * operations allowed by the entity, field, and its parents and decides whether to remove the
 * field.
 *
 * Arrays, groups, named tabs, and blocks are filtered recursively. Rows and unnamed tabs are
 * flattened by Payload, so their children are filtered at the containing level.
 *
 * @example Include fields writable through any collection operation the user can perform.
 * ```ts
 * filterFieldsByAccess({
 *   fields,
 *   permissions: collectionPermissions,
 *   shouldExcludeField: ({ create, update }) => !create && !update,
 * })
 * ```
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

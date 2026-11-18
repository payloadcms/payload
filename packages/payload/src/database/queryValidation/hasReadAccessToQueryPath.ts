import type { FieldsPermissions } from '../../auth/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { fieldShouldBeLocalized } from '../../fields/config/types.js'

/**
 * Query paths omit block slugs, so every block that can supply the complete path must allow it.
 * An absent path does not contribute; a schemaless suffix belongs to its JSON/rich text field.
 */
export const hasReadAccessToQueryPath = ({
  fields,
  isParentLocalized = false,
  permissions,
  req,
  resolvedField,
  segments,
  shouldShowHiddenFields = false,
}: {
  fields: FlattenedField[]
  isParentLocalized?: boolean
  permissions: FieldsPermissions
  req: PayloadRequest
  resolvedField: FlattenedField
  segments: string[]
  shouldShowHiddenFields?: boolean
}): boolean | undefined => {
  const field = fields.find((candidate) => candidate.name === segments[0])

  if (!field) {
    return undefined
  }

  const permission = permissions[field.name]
  const isLocalized = isParentLocalized || Boolean(field.localized)
  const localization = req.payload.config.localization
  let remaining = segments.slice(1)

  if (
    fieldShouldBeLocalized({ field, parentIsLocalized: isParentLocalized }) &&
    localization &&
    (localization.localeCodes.includes(remaining[0]!) || remaining[0] === req.locale)
  ) {
    remaining = remaining.slice(1)
  }

  const hasSameRelationshipShape =
    (resolvedField.type !== 'relationship' && resolvedField.type !== 'upload') ||
    ((field.type === 'relationship' || field.type === 'upload') &&
      JSON.stringify(field.relationTo) === JSON.stringify(resolvedField.relationTo) &&
      Boolean(field.hasMany) === Boolean(resolvedField.hasMany))

  let canRead: boolean | undefined

  if (!remaining.length || field.type === 'json' || field.type === 'richText') {
    canRead = true
  } else if (field.type === 'blocks') {
    if (remaining.length === 1 && remaining[0] === 'blockType') {
      canRead = true
    } else {
      const results = field.blocks
        .map((candidate) => {
          const block = typeof candidate === 'string' ? req.payload.blocks[candidate] : candidate

          return block
            ? hasReadAccessToQueryPath({
                fields: block.flattenedFields,
                isParentLocalized: isLocalized,
                permissions: permission?.blocks?.[block.slug]?.fields || {},
                req,
                resolvedField,
                segments: remaining,
                shouldShowHiddenFields,
              })
            : undefined
        })
        .filter((result) => result !== undefined)

      canRead = results.length ? results.every(Boolean) : undefined
    }
  } else if ('flattenedFields' in field) {
    canRead = hasReadAccessToQueryPath({
      fields: field.flattenedFields,
      isParentLocalized: isLocalized,
      permissions: permission?.fields || {},
      req,
      resolvedField,
      segments: remaining,
      shouldShowHiddenFields,
    })
  } else if (field.type === 'relationship' || field.type === 'upload') {
    // Entity hops are validated separately; all block variants must select the same relationship.
    canRead = hasSameRelationshipShape
  }

  return canRead === undefined
    ? undefined
    : Boolean(permission?.read?.permission) &&
        canRead &&
        (!('hidden' in field) || !field.hidden || shouldShowHiddenFields) &&
        (remaining.length > 0 || hasSameRelationshipShape)
}

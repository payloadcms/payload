import type { FieldsPermissions } from '../../auth/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { fieldShouldBeLocalized } from '../../fields/config/types.js'
import { resolveFieldPermissions } from '../../utilities/getFieldPermissions.js'

const childFields = (permission: any): FieldsPermissions | undefined =>
  permission === true ? true : permission?.fields

/**
 * A block path has no slug, so every schema contributing to that path must allow it.
 * Undefined means this schema does not contain the path, rather than granting access.
 * These are schema permissions: callbacks depending on document or row data must
 * deny access when that data is absent to prevent querying those fields.
 */
export function hasReadAccessToQueryPath({
  fields,
  isParentLocalized = false,
  isRelatedToMany,
  path,
  permissions,
  relatedCollectionSlug,
  req,
  shouldShowHiddenFields,
}: {
  fields: FlattenedField[]
  isParentLocalized?: boolean
  isRelatedToMany?: boolean
  path: string[]
  permissions?: FieldsPermissions
  relatedCollectionSlug?: string
  req: PayloadRequest
  shouldShowHiddenFields?: boolean
}): boolean | undefined {
  const field = fields.find((candidate) => candidate.name === path[0])

  if (!field) {
    return undefined
  }

  const permission: any = resolveFieldPermissions(permissions, field.name)
  const remainingPath = path.slice(1)
  const isLocalized = fieldShouldBeLocalized({ field, parentIsLocalized: isParentLocalized })
  const localization = req.payload.config.localization

  if (
    (isLocalized || field.localized) &&
    localization &&
    (localization.localeCodes.includes(remainingPath[0]!) || remainingPath[0] === req.locale)
  ) {
    remainingPath.shift()
  }

  let hasChildAccess: boolean | undefined = true

  if (remainingPath.length) {
    if (field.type === 'blocks') {
      if (remainingPath.length === 1 && remainingPath[0] === 'blockType') {
        hasChildAccess = true
      } else {
        const candidates = (field.blockReferences ?? field.blocks).flatMap((reference) => {
          const block = typeof reference === 'string' ? req.payload.blocks[reference] : reference

          if (!block) {
            return [false]
          }

          const result = hasReadAccessToQueryPath({
            fields: block.flattenedFields,
            isParentLocalized: isParentLocalized || isLocalized,
            isRelatedToMany,
            path: remainingPath,
            permissions: childFields(
              permission === true ? true : resolveFieldPermissions(permission?.blocks, block.slug),
            ),
            relatedCollectionSlug,
            req,
            shouldShowHiddenFields,
          })

          return result === undefined ? [] : [result]
        })

        hasChildAccess = candidates.length ? candidates.every(Boolean) : undefined
      }
    } else if ('flattenedFields' in field) {
      hasChildAccess = hasReadAccessToQueryPath({
        fields: field.flattenedFields,
        isParentLocalized: isParentLocalized || isLocalized,
        isRelatedToMany,
        path: remainingPath,
        permissions: childFields(permission),
        relatedCollectionSlug,
        req,
        shouldShowHiddenFields,
      })
    } else if (field.type === 'relationship' || field.type === 'upload') {
      hasChildAccess =
        Array.isArray(field.relationTo) &&
        remainingPath.length === 1 &&
        ['relationTo', 'value'].includes(remainingPath[0]!)
    } else if (field.type !== 'json' && field.type !== 'richText') {
      hasChildAccess = undefined
    }
  }

  if (hasChildAccess === undefined) {
    return undefined
  }

  // The resolver selects one related collection. Every contributing block schema must
  // resolve this hop to that same collection for its access predicate to be sufficient.
  if (
    relatedCollectionSlug &&
    (!remainingPath.length || field.type === 'json' || field.type === 'richText')
  ) {
    const collection =
      field.type === 'join'
        ? field.collection
        : field.type === 'relationship' || field.type === 'upload'
          ? field.relationTo
          : undefined

    const hasMany =
      field.type === 'join' ||
      ((field.type === 'relationship' || field.type === 'upload') && Boolean(field.hasMany))

    if (collection !== relatedCollectionSlug || hasMany !== isRelatedToMany) {
      return false
    }
  }

  return Boolean(
    (permission === true || permission?.read === true || permission?.read?.permission) &&
      hasChildAccess &&
      !('hidden' in field && field.hidden && !shouldShowHiddenFields),
  )
}

import type { CollectionSlug } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { FieldHook, PolymorphicRelationshipField } from '../../config/types.js'
import type { Authorship, SanitizedAuthorship } from './types.js'

export type { Authorship, SanitizedAuthorship }

/**
 * Resolves the `authorship` config (`true`/`false`/object) into its canonical
 * `{ createdBy, updatedBy }` form, defaulting missing keys to `true`.
 */
export const sanitizeAuthorship = (
  authorship: Authorship | boolean | undefined,
): SanitizedAuthorship => {
  if (authorship === false) {
    return { createdBy: false, updatedBy: false }
  }

  if (authorship === true || authorship === undefined) {
    return { createdBy: true, updatedBy: true }
  }

  return {
    createdBy: authorship.createdBy ?? true,
    updatedBy: authorship.updatedBy ?? true,
  }
}

type RelationValue = { relationTo: string; value: unknown } | null | undefined

const relationsEqual = (a: RelationValue, b: RelationValue): boolean => {
  if (a === b) {
    return true
  }

  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return false
  }

  return a.relationTo === b.relationTo && a.value === b.value
}

// Update data is merged with the stored doc, so an untouched field equals its previous value.
// Only treat it as explicit when defined and changed (lets `null` clear it or a caller override).
const isExplicitlyProvided = (incoming: RelationValue, previousValue: RelationValue): boolean =>
  incoming !== undefined && !relationsEqual(incoming, previousValue)

const userToRelation = (req: PayloadRequest): RelationValue => {
  if (req.user?.collection && req.user.id !== undefined && req.user.id !== null) {
    return { relationTo: req.user.collection, value: req.user.id }
  }

  return undefined
}

const setUpdatedBy: FieldHook = ({ data, previousValue, req }) => {
  const incoming = data?.updatedBy as RelationValue

  if (isExplicitlyProvided(incoming, previousValue as RelationValue)) {
    return incoming
  }

  // No usable user (e.g. Local API without `req.user`): leave unchanged.
  return userToRelation(req) ?? previousValue
}

const setCreatedBy: FieldHook = ({ data, previousValue, req }) => {
  // Immutable once set. Keying off previousValue (not the operation) means globals —
  // created via `update` — still get stamped on first write.
  if (previousValue) {
    return previousValue
  }

  const incoming = data?.createdBy as RelationValue

  if (isExplicitlyProvided(incoming, previousValue as RelationValue)) {
    return incoming
  }

  return userToRelation(req) ?? previousValue
}

// On duplicate, drop the copied value so the new document is re-attributed to the
// duplicating user by the beforeChange hook rather than inheriting the original author.
const clearCreatedByOnDuplicate: FieldHook = ({ siblingData }) => {
  delete siblingData.createdBy
}

const clearUpdatedByOnDuplicate: FieldHook = ({ siblingData }) => {
  delete siblingData.updatedBy
}

/**
 * Builds the `createdBy` / `updatedBy` fields to inject, per the sanitized `authorship` config.
 * Empty when there are no auth-enabled collections to relate to.
 */
export const getAuthorshipFields = ({
  authCollections,
  authorship,
}: {
  authCollections: CollectionSlug[]
  authorship: SanitizedAuthorship
}): PolymorphicRelationshipField[] => {
  const fields: PolymorphicRelationshipField[] = []

  if (authCollections.length === 0) {
    return fields
  }

  if (authorship.createdBy) {
    fields.push({
      name: 'createdBy',
      type: 'relationship',
      // Block client writes so authorship can't be spoofed; the hook sets the value.
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        disabled: { bulkEdit: true },
        hidden: true,
      },
      hooks: {
        beforeChange: [setCreatedBy],
        beforeDuplicate: [clearCreatedByOnDuplicate],
      },
      label: ({ t }) => t('general:createdBy'),
      maxDepth: 1,
      relationTo: authCollections,
    })
  }

  if (authorship.updatedBy) {
    fields.push({
      name: 'updatedBy',
      type: 'relationship',
      // Block client writes so authorship can't be spoofed; the hook sets the value.
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        disabled: { bulkEdit: true },
        hidden: true,
      },
      hooks: {
        beforeChange: [setUpdatedBy],
        beforeDuplicate: [clearUpdatedByOnDuplicate],
      },
      label: ({ t }) => t('general:updatedBy'),
      maxDepth: 1,
      relationTo: authCollections,
    })
  }

  return fields
}

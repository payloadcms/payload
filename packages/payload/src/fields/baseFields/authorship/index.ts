import type { CollectionSlug } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { FieldHook, PolymorphicRelationshipField } from '../../config/types.js'
import type { Authorship, SanitizedAuthorship } from './types.js'

export type { Authorship, SanitizedAuthorship }

/**
 * Resolves the incoming `authorship` config into its canonical object form.
 * - `undefined` / `true` => both fields enabled
 * - `false` => both fields disabled
 * - object => missing keys default to `true`
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

/**
 * The document data passed to update operations is merged with the existing
 * document, so an untouched relationship field arrives equal to its previous
 * value. We therefore treat a value as explicitly provided only when it is
 * defined (an intentional `null` clears the field) and differs from the stored
 * value. This lets a caller override the system-derived user while still
 * defaulting to `req.user`.
 */
const isExplicitlyProvided = (incoming: RelationValue, previousValue: RelationValue): boolean =>
  incoming !== undefined && !relationsEqual(incoming, previousValue)

const userToRelation = (req: PayloadRequest): RelationValue => {
  // Skip stamping when `collection` is missing rather than writing an invalid `relationTo`.
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

  // No (usable) user on the request (e.g. Local API without `req.user`): leave the value unchanged.
  return userToRelation(req) ?? previousValue
}

const setCreatedBy: FieldHook = ({ data, previousValue, req }) => {
  // Once set, `createdBy` is immutable. Keying off the previous value (rather than
  // the operation) means globals — which are created via an `update` — also get
  // stamped on their first write.
  if (previousValue) {
    return previousValue
  }

  const incoming = data?.createdBy as RelationValue

  if (isExplicitlyProvided(incoming, previousValue as RelationValue)) {
    return incoming
  }

  return userToRelation(req) ?? previousValue
}

/**
 * Returns the `createdBy` / `updatedBy` fields that should be injected into a
 * collection or global based on its sanitized `authorship` config.
 *
 * Returns an empty array when there are no auth-enabled collections to relate to.
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
      admin: {
        disabled: { bulkEdit: true },
        hidden: true,
      },
      hooks: {
        beforeChange: [setCreatedBy],
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
      admin: {
        disabled: { bulkEdit: true },
        hidden: true,
      },
      hooks: {
        beforeChange: [setUpdatedBy],
      },
      label: ({ t }) => t('general:updatedBy'),
      maxDepth: 1,
      relationTo: authCollections,
    })
  }

  return fields
}

/**
 * Builds the `$expr` match stage used by multi-collection joins.
 *
 * The joined field (`on`) may hold a single id (single-value relationship)
 * or an array of ids (hasMany relationship). A plain `$eq` never matches an
 * array, so the match branches on the stored value's shape.
 *
 * Polymorphic relationship fields (`relationTo` is an array) store
 * `{ relationTo, value }` objects instead of raw ids, so the match compares
 * against `.value`: a dotted path for the scalar case and `$map` for arrays,
 * because `$expr` does not auto-traverse arrays the way query-language dot
 * notation does.
 */
export const buildMultiCollectionJoinMatch = (on: string, polymorphic = false) => {
  const fieldPath = `$${on}`
  const scalarMatch = polymorphic
    ? { $eq: [`${fieldPath}.value`, '$$root_id_'] }
    : { $eq: [fieldPath, '$$root_id_'] }
  const arrayMatch = polymorphic
    ? {
        $in: ['$$root_id_', { $map: { input: fieldPath, as: 'ref', in: '$$ref.value' } }],
      }
    : { $in: ['$$root_id_', fieldPath] }

  return {
    $cond: {
      if: { $isArray: fieldPath },
      then: arrayMatch,
      else: scalarMatch,
    },
  }
}

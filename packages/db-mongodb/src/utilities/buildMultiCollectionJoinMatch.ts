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
 * notation does. Both polymorphic branches also require `relationTo` to equal
 * the parent collection: without it, a reference to a different collection
 * whose id happens to collide (possible with custom ids) would produce a
 * false join. `parentCollectionSlug` must be passed whenever `polymorphic`
 * is true.
 */
export const buildMultiCollectionJoinMatch = (
  on: string,
  polymorphic = false,
  parentCollectionSlug?: string,
) => {
  const fieldPath = `$${on}`
  const scalarMatch = polymorphic
    ? {
        $and: [
          { $eq: [`${fieldPath}.value`, '$$root_id_'] },
          { $eq: [`${fieldPath}.relationTo`, parentCollectionSlug] },
        ],
      }
    : { $eq: [fieldPath, '$$root_id_'] }
  const arrayMatch = polymorphic
    ? {
        // `$in: [true, ...]` is "any member matches": the mapped booleans
        // require `relationTo` and `value` to match on the SAME reference
        // object, so a colliding id from another collection cannot join.
        $in: [
          true,
          {
            $map: {
              input: fieldPath,
              as: 'ref',
              in: {
                $and: [
                  { $eq: ['$$ref.value', '$$root_id_'] },
                  { $eq: ['$$ref.relationTo', parentCollectionSlug] },
                ],
              },
            },
          },
        ],
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

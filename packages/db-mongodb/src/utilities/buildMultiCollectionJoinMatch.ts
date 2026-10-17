/**
 * Builds the `$expr` match stage used by multi-collection joins.
 *
 * The joined field (`on`) may hold a single id (single-value relationship)
 * or an array of ids (hasMany relationship). A plain `$eq` never matches an
 * array, so the match branches on the stored value's shape.
 */
export const buildMultiCollectionJoinMatch = (on: string) => ({
  $cond: {
    if: { $isArray: `$${on}` },
    then: { $in: ['$$root_id_', `$${on}`] },
    else: { $eq: [`$${on}`, '$$root_id_'] },
  },
})
